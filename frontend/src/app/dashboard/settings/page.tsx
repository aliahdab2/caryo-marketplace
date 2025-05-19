"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/components/EnhancedLanguageProvider";
import { SupportedLanguage } from "@/utils/i18n";

export default function SettingsPage() {
  const { t } = useTranslation('common');
  const { locale, changeLanguage } = useLanguage();

  const [accountSettings, setAccountSettings] = useState({
    language: locale, // Initialize with current locale
    timezone: "UTC+3", // Default to Syria timezone
    currency: "SYP", // Default to Syrian Pound
  });

  // State for loading indicator during language change
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Effect to keep the language dropdown value synchronized with the actual locale from context
  useEffect(() => {
    setAccountSettings(prev => ({
      ...prev,
      language: locale,
    }));
  }, [locale]);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newMessages: true,
    listingExpiry: true,
    priceDrops: false,
    newsletter: true,
    marketing: false,
  });
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: false,
    showEmail: false,
    allowAnalytics: true,
  });

  // Handle account settings changes
  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "language") {
      const newLanguage = value as SupportedLanguage;
      if (newLanguage !== locale) { // Only proceed if the language is actually different
        setIsChangingLanguage(true);
        changeLanguage(newLanguage)
          .catch((error) => {
            console.error("Failed to change language:", error);
            // If change fails, locale won't update.
            // The useEffect above will ensure accountSettings.language reverts to the old locale.
          })
          .finally(() => {
            setIsChangingLanguage(false);
          });
      }
      // The useEffect syncing with `locale` will handle updating the dropdown display
      // once the language change is complete and the context updates.
      // No immediate local state update for language here.
    } else {
      // For other settings like timezone, currency
      setAccountSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = (setting: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  // Handle privacy toggle
  const handlePrivacyToggle = (setting: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // Here you would make API calls to save the settings
    console.log("Saving settings:", {
      accountSettings,
      notificationSettings,
      privacySettings
    });
    
    // TODO: If a global notification system exists and is preferred for "Settings Saved",
    // trigger it here. For now, this component will not show its own toast for this action.
    // alert(t('settings.savedSuccessfully')); // Example of a simple browser alert if needed
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('dashboard.settings')}</h1>
      
      {/* Account Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('settings.accountPreferences')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.language')}
            </label>
            <select
              name="language"
              value={accountSettings.language}
              onChange={handleAccountChange}
              disabled={isChangingLanguage} // Disable while changing
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:opacity-50"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.timezone')}
            </label>
            <select
              name="timezone"
              value={accountSettings.timezone}
              onChange={handleAccountChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="UTC+3">Syria (GMT+3)</option>
              <option value="UTC+4">UAE (GMT+4)</option>
              <option value="UTC+0">London (GMT+0)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.currency')}
            </label>
            <select
              name="currency"
              value={accountSettings.currency}
              onChange={handleAccountChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="SYP">SYP (Syrian Pound)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
              <option value="USD">USD (US Dollar)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('settings.notificationSettings')}</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.emailNotifications')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.emailNotificationsDesc')}</p>
            </div>
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notificationSettings.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.pushNotifications')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.pushNotificationsDesc')}</p>
            </div>
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={notificationSettings.pushNotifications}
                  onChange={() => handleNotificationToggle('pushNotifications')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('settings.notificationsFor')}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('settings.newMessages')}</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.newMessages}
                    onChange={() => handleNotificationToggle('newMessages')} 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('settings.listingExpiry')}</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.listingExpiry}
                    onChange={() => handleNotificationToggle('listingExpiry')} 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('settings.priceDrops')}</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.priceDrops}
                    onChange={() => handleNotificationToggle('priceDrops')} 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('settings.newsletter')}</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.newsletter}
                    onChange={() => handleNotificationToggle('newsletter')} 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('settings.marketing')}</span>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.marketing}
                    onChange={() => handleNotificationToggle('marketing')} 
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Privacy Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{t('settings.privacySettings')}</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.showPhone')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.showPhoneDesc')}</p>
            </div>
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={privacySettings.showPhone}
                  onChange={() => handlePrivacyToggle('showPhone')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.showEmail')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.showEmailDesc')}</p>
            </div>
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={privacySettings.showEmail}
                  onChange={() => handlePrivacyToggle('showEmail')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.analytics')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.analyticsDesc')}</p>
            </div>
            <div>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={privacySettings.allowAnalytics}
                  onChange={() => handlePrivacyToggle('allowAnalytics')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="py-2 px-6 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          {t('saveChanges')}
        </button>
      </div>
      
      {/* Danger Zone */}
      <div className="mt-12 border border-red-200 dark:border-red-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">{t('settings.dangerZone')}</h2>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-3 md:mb-0">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('settings.deleteAccount')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.deleteAccountDesc')}</p>
            </div>
            <button className="py-2 px-4 bg-white dark:bg-gray-800 text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
              {t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
