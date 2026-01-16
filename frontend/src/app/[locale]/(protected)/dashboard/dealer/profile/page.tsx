'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDealerProfile, useUpdateDealerProfile } from '@/hooks/queries';
import { LoadingSkeleton, ErrorDisplay } from '@/components/common';
import Link from 'next/link';

// Days of the week for working hours
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface WorkingHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

interface SocialLinksData {
  facebook: string;
  instagram: string;
  whatsapp: string;
  twitter: string;
  youtube: string;
}

interface DealerProfileFormData {
  businessName: string;
  tradingAddress: string;
  businessEmail: string;
  businessPhone: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  descriptionAr: string;
  workingHours: Record<string, WorkingHoursDay>;
  socialLinks: SocialLinksData;
  specialties: string[];
}

const defaultWorkingHours: Record<string, WorkingHoursDay> = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '13:00', closed: false },
  saturday: { open: '09:00', close: '15:00', closed: false },
  sunday: { open: '', close: '', closed: true },
};

const defaultSocialLinks: SocialLinksData = {
  facebook: '',
  instagram: '',
  whatsapp: '',
  twitter: '',
  youtube: '',
};

// Parse working hours from JSON string to structured object
function parseWorkingHours(jsonString?: string): Record<string, WorkingHoursDay> {
  if (!jsonString) return { ...defaultWorkingHours };
  try {
    const parsed = JSON.parse(jsonString);
    const result: Record<string, WorkingHoursDay> = {};
    
    for (const day of DAYS_OF_WEEK) {
      const value = parsed[day] || parsed[day.charAt(0).toUpperCase() + day.slice(1)];
      if (!value || value.toLowerCase() === 'closed' || value === 'مغلق') {
        result[day] = { open: '', close: '', closed: true };
      } else {
        // Try to parse "9:00 AM - 6:00 PM" format
        const match = value.match(/(\d{1,2}:\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i);
        if (match) {
          let openHour = parseInt(match[1].split(':')[0]);
          let closeHour = parseInt(match[3].split(':')[0]);
          const openMinute = match[1].split(':')[1];
          const closeMinute = match[3].split(':')[1];
          
          if (match[2]?.toLowerCase() === 'pm' && openHour < 12) openHour += 12;
          if (match[4]?.toLowerCase() === 'pm' && closeHour < 12) closeHour += 12;
          if (match[2]?.toLowerCase() === 'am' && openHour === 12) openHour = 0;
          if (match[4]?.toLowerCase() === 'am' && closeHour === 12) closeHour = 0;
          
          result[day] = {
            open: `${openHour.toString().padStart(2, '0')}:${openMinute}`,
            close: `${closeHour.toString().padStart(2, '0')}:${closeMinute}`,
            closed: false,
          };
        } else {
          result[day] = { open: '09:00', close: '18:00', closed: false };
        }
      }
    }
    return result;
  } catch {
    return { ...defaultWorkingHours };
  }
}

// Convert working hours back to JSON string for API
function workingHoursToJson(hours: Record<string, WorkingHoursDay>): string {
  const result: Record<string, string> = {};
  for (const day of DAYS_OF_WEEK) {
    const dayData = hours[day];
    if (dayData.closed) {
      result[day] = 'Closed';
    } else {
      const openHour = parseInt(dayData.open.split(':')[0]);
      const closeHour = parseInt(dayData.close.split(':')[0]);
      const openMinute = dayData.open.split(':')[1];
      const closeMinute = dayData.close.split(':')[1];
      
      const formatTime = (hour: number, minute: string) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minute} ${period}`;
      };
      
      result[day] = `${formatTime(openHour, openMinute)} - ${formatTime(closeHour, closeMinute)}`;
    }
  }
  return JSON.stringify(result);
}

// Parse social links from JSON string
function parseSocialLinks(jsonString?: string): SocialLinksData {
  if (!jsonString) return { ...defaultSocialLinks };
  try {
    const parsed = JSON.parse(jsonString);
    return {
      facebook: parsed.facebook || '',
      instagram: parsed.instagram || '',
      whatsapp: parsed.whatsapp || '',
      twitter: parsed.twitter || '',
      youtube: parsed.youtube || '',
    };
  } catch {
    return { ...defaultSocialLinks };
  }
}

// Convert social links to JSON string
function socialLinksToJson(links: SocialLinksData): string {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(links)) {
    if (value) filtered[key] = value;
  }
  return Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : '';
}

// Icons
const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default function DealerProfilePage() {
  const { t, i18n } = useTranslation(['dealer', 'common', 'dashboard']);
  const isRtl = i18n.language === 'ar';
  const { data: profile, isLoading, isError, refetch } = useDealerProfile();
  const updateMutation = useUpdateDealerProfile();
  const [specialtiesInput, setSpecialtiesInput] = useState('');

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<DealerProfileFormData>({
    defaultValues: {
      businessName: '',
      tradingAddress: '',
      businessEmail: '',
      businessPhone: '',
      logoUrl: '',
      bannerUrl: '',
      description: '',
      descriptionAr: '',
      workingHours: defaultWorkingHours,
      socialLinks: defaultSocialLinks,
      specialties: [],
    },
  });

  const watchedLogoUrl = watch('logoUrl');
  const watchedBannerUrl = watch('bannerUrl');
  const watchedSpecialties = watch('specialties');

  useEffect(() => {
    if (profile) {
      const parsedHours = parseWorkingHours(profile.workingHours);
      const parsedLinks = parseSocialLinks(profile.socialLinks);
      
      reset({
        businessName: profile.businessName || '',
        tradingAddress: profile.tradingAddress || '',
        businessEmail: profile.businessEmail || '',
        businessPhone: profile.businessPhone || '',
        logoUrl: profile.logoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        description: profile.description || '',
        descriptionAr: profile.descriptionAr || '',
        workingHours: parsedHours,
        socialLinks: parsedLinks,
        specialties: profile.specialties || [],
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: DealerProfileFormData) => {
    const payload = {
      ...data,
      workingHours: workingHoursToJson(data.workingHours),
      socialLinks: socialLinksToJson(data.socialLinks),
    };
    await updateMutation.mutateAsync(payload);
  };

  const addSpecialty = () => {
    if (specialtiesInput.trim() && !watchedSpecialties.includes(specialtiesInput.trim())) {
      setValue('specialties', [...watchedSpecialties, specialtiesInput.trim()]);
      setSpecialtiesInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setValue('specialties', watchedSpecialties.filter(s => s !== specialty));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          error={t('common:errorLoadingData')}
          retry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('editProfile')}
        </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('manageProfile')}
            </p>
          </div>
          <Link
            href={`/dealers/${profile.id}`}
            target="_blank"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            {t('viewPublicProfile')} →
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Banner & Logo Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('brandingMedia')}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Banner Preview & Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('bannerImage')}
                </label>
                <div className="relative h-40 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl overflow-hidden mb-3">
                  {watchedBannerUrl ? (
                    <img src={watchedBannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white/70">
                        <ImageIcon />
                        <p className="text-sm mt-2">{t('noBannerSet')}</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('bannerUrl')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('bannerHelp')}</p>
              </div>

              {/* Logo Preview & Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('logoImage')}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                    {watchedLogoUrl ? (
                      <img src={watchedLogoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {...register('logoUrl')}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('logoHelp')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('businessInfo')}
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('businessName')} *
            </label>
            <input
              type="text"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('businessName', { required: true })}
            />
          </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('businessEmail')}
              </label>
              <input
                type="email"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                {...register('businessEmail')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('businessPhone')}
              </label>
              <input
                    type="tel"
                    placeholder="+963-11-234-5678"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                {...register('businessPhone')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('tradingAddress')}
            </label>
            <input
              type="text"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              {...register('tradingAddress')}
            />
          </div>

              {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('specialties')}
              </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {watchedSpecialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      {specialty}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(specialty)}
                        className="hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
              <input
                type="text"
                    value={specialtiesInput}
                    onChange={(e) => setSpecialtiesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    placeholder={t('addSpecialty')}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addSpecialty}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
                  >
                    {t('common:add')}
                  </button>
                </div>
            </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('aboutYourBusiness')}
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('description')}
            </label>
            <textarea
              rows={4}
                  placeholder={t('descriptionPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('descriptionArabic')}
            </label>
            <textarea
              rows={4}
                  dir="rtl"
                  placeholder="أخبر العملاء عن وكالتك وتاريخها وما يميزك..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              {...register('descriptionAr')}
            />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('workingHours')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <Controller
                    key={day}
                    name={`workingHours.${day}` as const}
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="w-28 font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {t(day)}
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value.closed}
                            onChange={(e) => field.onChange({ ...field.value, closed: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('closed')}
                          </span>
            </label>
                        {!field.value.closed && (
                          <>
                            <input
                              type="time"
                              value={field.value.open}
                              onChange={(e) => field.onChange({ ...field.value, open: e.target.value })}
                              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            />
                            <span className="text-gray-500">—</span>
                            <input
                              type="time"
                              value={field.value.close}
                              onChange={(e) => field.onChange({ ...field.value, close: e.target.value })}
                              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                            />
                          </>
                        )}
                      </div>
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('socialMedia')}
              </h2>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/yourdealership"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('socialLinks.facebook')}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                  </svg>
                  Instagram
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/yourdealership"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('socialLinks.instagram')}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+963912345678"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('socialLinks.whatsapp')}
            />
          </div>

          <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg className="w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter / X
            </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/yourdealership"
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  {...register('socialLinks.twitter')}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pb-8">
            {updateMutation.isError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {t('saveFailed')}
              </span>
            )}
            {updateMutation.isSuccess && (
              <span className="text-sm text-green-600 dark:text-green-400">
                {t('saveSuccess')}
              </span>
            )}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {updateMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('common:saving')}
                </>
              ) : (
                <>
                  <SaveIcon />
                  {t('common:saveChanges')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
