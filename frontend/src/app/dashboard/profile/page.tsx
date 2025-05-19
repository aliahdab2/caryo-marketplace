"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state (in a real app, this would be handled with React Hook Form)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
    location: '',
    bio: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would make an API call to update the user profile
    console.log("Form data to submit:", formData);
    // Mock success - in real app this would happen after API response
    setTimeout(() => {
      setIsEditing(false);
      // Show success message
    }, 500);
  };

  // Get user roles as string
  const userRoles = session?.user && 'roles' in session.user && Array.isArray(session.user.roles)
    ? session.user.roles.join(", ")
    : t('dashboard.noRoles');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('dashboard.profile')}</h1>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {t('edit')}
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.username')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">{t('dashboard.emailCannotBeChanged')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('location')}
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dashboard.bio')}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              {t('save')}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-4xl">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-semibold">{session?.user?.name || t('notAvailable')}</h2>
              <p className="text-gray-500 dark:text-gray-400">{session?.user?.email || t('notAvailable')}</p>
              <p className="text-sm mt-1">
                <span className="font-medium">{t('dashboard.role')}:</span> {userRoles}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t dark:border-gray-700 pt-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('dashboard.accountInfo')}</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('auth.userId')}:</span>
                  <span>{session?.user?.id || t('notAvailable')}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('memberSince')}:</span>
                  <span>May 2023</span>
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('dashboard.contactInfo')}</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('phone')}:</span>
                  <span>{formData.phone || t('notProvided')}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('location')}:</span>
                  <span>{formData.location || t('notProvided')}</span>
                </p>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('dashboard.bio')}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {formData.bio || t('dashboard.noBio')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.accountSecurity')}</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('auth.password')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.lastUpdated')}: 3 months ago</p>
            </div>
            <button className="text-primary hover:underline">{t('auth.changePassword')}</button>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('dashboard.twoFactorAuth')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.improveAccountSecurity')}</p>
            </div>
            <button className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('dashboard.setupTwoFactor')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
