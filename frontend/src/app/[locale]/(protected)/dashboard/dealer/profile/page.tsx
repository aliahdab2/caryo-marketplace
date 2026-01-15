'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDealerProfile, useUpdateDealerProfile } from '@/hooks/queries';
import { LoadingSkeleton, ErrorDisplay } from '@/components/common';

interface DealerProfileFormData {
  businessName?: string;
  tradingAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  descriptionAr?: string;
  workingHours?: string;
  socialLinks?: string;
}

export default function DealerProfilePage() {
  const { t } = useTranslation(['common', 'profile']);
  const { data: profile, isLoading, isError, refetch } = useDealerProfile();
  const updateMutation = useUpdateDealerProfile();

  const { register, handleSubmit, reset } = useForm<DealerProfileFormData>({
    defaultValues: {
      businessName: '',
      tradingAddress: '',
      businessEmail: '',
      businessPhone: '',
      logoUrl: '',
      bannerUrl: '',
      description: '',
      descriptionAr: '',
      workingHours: '',
      socialLinks: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        businessName: profile.businessName || '',
        tradingAddress: profile.tradingAddress || '',
        businessEmail: profile.businessEmail || '',
        businessPhone: profile.businessPhone || '',
        logoUrl: profile.logoUrl || '',
        bannerUrl: profile.bannerUrl || '',
        description: profile.description || '',
        descriptionAr: profile.descriptionAr || '',
        workingHours: profile.workingHours || '',
        socialLinks: profile.socialLinks || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: DealerProfileFormData) => {
    await updateMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay
          error={t('common:errorLoadingData', 'Error loading data. Please try again.')}
          retry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('dealerProfile', 'Dealer Profile')}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('businessName', 'Business Name')}
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              {...register('businessName')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('businessEmail', 'Business Email')}
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                {...register('businessEmail')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('businessPhone', 'Business Phone')}
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                {...register('businessPhone')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('tradingAddress', 'Trading Address')}
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              {...register('tradingAddress')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('logoUrl', 'Logo URL')}
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                {...register('logoUrl')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bannerUrl', 'Banner URL')}
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                {...register('bannerUrl')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('description', 'Description')}
            </label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('descriptionAr', 'Description (Arabic)')}
            </label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              {...register('descriptionAr')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('workingHours', 'Working Hours (JSON)')}
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder='{"weekdays":"9:00 AM - 6:00 PM","saturday":"9:00 AM - 3:00 PM","sunday":"Closed"}'
              {...register('workingHours')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('socialLinks', 'Social Links (JSON)')}
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder='{"facebook":"https://...","instagram":"https://...","whatsapp":"+963..."}'
              {...register('socialLinks')}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {updateMutation.isPending ? t('saving', 'Saving...') : t('saveChanges', 'Save changes')}
            </button>
          </div>

          {updateMutation.isError && (
            <div className="text-sm text-red-600">
              {t('saveFailed', 'Failed to save changes. Please try again.')}
            </div>
          )}
          {updateMutation.isSuccess && (
            <div className="text-sm text-green-600">
              {t('saveSuccess', 'Profile updated successfully.')}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
