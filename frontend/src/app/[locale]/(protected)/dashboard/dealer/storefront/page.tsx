'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDealerProfile, useUpdateDealerProfile } from '@/hooks/queries';
import { LoadingSkeleton, ErrorDisplay } from '@/components/common';
import Link from 'next/link';
import {
  parseSocialLinks,
  socialLinksToJson,
  getPlatformInfo,
  SOCIAL_PLATFORMS,
  type SocialLinkEntry,
} from './socialLinksUtils';

// Days of the week for working hours
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface WorkingHoursDay {
  open: string;
  close: string;
  closed: boolean;
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
  socialLinks: SocialLinkEntry[];
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

const defaultSocialLinks: SocialLinkEntry[] = [];

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

export default function DealerStorefrontPage() {
  const { t, i18n } = useTranslation(['dealer', 'common', 'dashboard']);
  const isRtl = i18n.language === 'ar';
  const { data: profile, isLoading, isError, refetch } = useDealerProfile();
  const updateMutation = useUpdateDealerProfile();
  const [specialtiesInput, setSpecialtiesInput] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('');

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
  const watchedSocialLinks = watch('socialLinks');

  // Get platforms that haven't been added yet
  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    (p) => !watchedSocialLinks.some((link) => link.platform === p.id)
  );

  // Add a new social link
  const addSocialLink = () => {
    if (newSocialPlatform) {
      setValue('socialLinks', [...watchedSocialLinks, { platform: newSocialPlatform, url: '' }]);
      setNewSocialPlatform('');
    }
  };

  // Remove a social link
  const removeSocialLink = (platform: string) => {
    setValue('socialLinks', watchedSocialLinks.filter((link) => link.platform !== platform));
  };

  // Update a social link URL
  const updateSocialLinkUrl = (platform: string, url: string) => {
    setValue(
      'socialLinks',
      watchedSocialLinks.map((link) => (link.platform === platform ? { ...link, url } : link))
    );
  };

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
              {t('storefront', { defaultValue: 'Storefront' })}
        </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('manageStorefront', { defaultValue: 'Manage your public business profile' })}
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

          {/* Social Links - Dynamic */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-blue-600 rounded-full" />
                {t('socialMedia')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('socialMediaHelp', { defaultValue: 'Add your social media profiles to help customers connect with you' })}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Existing Social Links */}
              {watchedSocialLinks.length > 0 && (
                <div className="space-y-3">
                  {watchedSocialLinks.map((link) => {
                    const platform = getPlatformInfo(link.platform);
                    return (
                      <div key={link.platform} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className={`text-2xl flex-shrink-0 ${platform?.color || ''}`}>
                          {platform?.icon || '🔗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {platform?.name || link.platform}
                          </label>
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => updateSocialLinkUrl(link.platform, e.target.value)}
                            placeholder={platform?.placeholder || 'Enter URL or handle'}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocialLink(link.platform)}
                          className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('remove', { ns: 'common', defaultValue: 'Remove' })}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add New Social Link */}
              {availablePlatforms.length > 0 && (
                <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <select
                    value={newSocialPlatform}
                    onChange={(e) => setNewSocialPlatform(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('selectPlatform', { defaultValue: 'Select a platform...' })}</option>
                    {availablePlatforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.icon} {platform.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addSocialLink}
                    disabled={!newSocialPlatform}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('add', { ns: 'common', defaultValue: 'Add' })}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {watchedSocialLinks.length === 0 && (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-sm">{t('noSocialLinks', { defaultValue: 'No social links added yet. Add your first one above!' })}</p>
                </div>
              )}

              {/* All Platforms Added */}
              {availablePlatforms.length === 0 && watchedSocialLinks.length > 0 && (
                <div className="text-center py-4 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-sm font-medium">✓ {t('allPlatformsAdded', { defaultValue: 'All available platforms have been added!' })}</p>
                </div>
              )}
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
