'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SimpleVerification from '@/components/auth/SimpleVerification';
import useLazyTranslation from '@/hooks/useLazyTranslation';

export default function ContactPage() {
  const { t, ready: contactReady } = useLazyTranslation('contact');
  const { t: tCommon, ready: commonReady } = useLazyTranslation('common');
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('form.name.validation.required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('form.name.validation.minLength');
    }
    
    // Email validation with improved regex for better international domain support
    if (!formData.email.trim()) {
      newErrors.email = t('form.email.validation.required');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('form.email.validation.invalid');
    }
    
    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = t('form.subject.validation.required');
    }
    
    // Message validation with improved length check
    if (!formData.message.trim()) {
      newErrors.message = t('form.message.validation.required');
    } else if (formData.message.trim().length < 20) {
      newErrors.message = t('form.message.validation.minLength');
    }
    
    // Verification check
    if (!isVerified) {
      newErrors.form = t('form.verification.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setErrors({});
    
    // Check form validity
    if (!validateForm()) return;
    
    // Check verification status
    if (!isVerified) {
      setErrors({
        form: t('form.verification.required')
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Here you would typically send the data to your API
      // For now, we'll simulate a successful submission with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSubmitSuccess(true);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset verification for next use
      resetVerification();
      
      // No immediate redirect - let user see the success message first
      // They can click the "Back to Home" button if they want to leave
      // This is better UX than auto-redirecting
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        form: t('error.submissionFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle verification status update
  const handleVerification = useCallback((verified: boolean) => {
    setIsVerified(verified);
  }, []); // Empty dependency array as setIsVerified is stable

  // Create a verificationKey to force remount of verification component only when needed
  const [verificationKey, setVerificationKey] = useState<number>(1);

  // Reset verification on form submit
  const resetVerification = useCallback(() => {
    setIsVerified(false);
    setVerificationKey(prev => prev + 1);
  }, []); // setIsVerified is stable

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Show loading indicator while translations are being loaded */}
      {(!contactReady || !commonReady) && (
        <div className="flex items-center justify-center w-full min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Only render the page content when translations are ready */}
      {contactReady && commonReady && (
        <>
          {/* Left section - Brand/imagery */}
          <div className="hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex-col justify-between relative overflow-hidden">
            {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="contactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#contactGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#contactGradient)" opacity="0.5" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="z-10 p-6 md:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 relative flex-shrink-0">
              <Image 
                src="/images/logo.svg" 
                alt={tCommon('logoAlt', 'Caryo Logo')} 
                width={40} 
                height={40} 
                className="mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10 object-contain filter invert" 
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold">{tCommon('appName', 'Caryo Marketplace')}</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('form.title')}</h2>
          <p className="text-sm md:text-base opacity-80">{t('form.description')}</p>
          
          <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/5">
            <div className="flex items-start mb-3">
              <div className="mr-2.5 mt-0.5 text-blue-200 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-xs leading-relaxed">
                {t('sidebar.businessHours.title')} {/* Assuming this was a typo and should be a general quick response text or moved to sidebar section */}
              </p>
            </div>
            <div className="flex items-start">
              <div className="mr-2.5 mt-0.5 text-blue-200 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-xs leading-relaxed">
                {t('sidebar.businessHours.weekdays')} {t('sidebar.businessHours.weekdaysTime')} {/* Assuming this was a typo and should be a general support hours text or moved to sidebar section */}
              </p>
            </div>
          </div>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {tCommon('appName', 'Caryo Marketplace')}</p>
          <p className="opacity-60">{tCommon('privacyPolicy', 'Privacy Policy')} • {tCommon('termsOfService', 'Terms of Service')}</p>
        </div>
      </div>

      {/* Right section - Form */}
      <div className="w-full md:w-3/5 lg:w-2/3 xl:w-3/4 p-6 md:p-10 lg:p-16 overflow-y-auto">
        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-6 bg-green-100 dark:bg-green-700 rounded-full mb-6">
              <svg className="w-16 h-16 text-green-500 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">{t('success.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">{t('success.message')}</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
            >
              {t('success.backToHome')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto" noValidate>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t('form.title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{t('form.description')}</p>
            </div>

            {/* Name Field */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.name.label')}</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  autoComplete="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('form.name.placeholder')}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.email.label')}</label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  autoComplete="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('form.email.placeholder')}
                  className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.subject.label')}</label>
              <select 
                id="subject" 
                name="subject" 
                value={formData.subject}
                onChange={handleChange}
                className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.subject ? 'true' : 'false'}
                aria-describedby={errors.subject ? 'subject-error' : undefined}
              >
                <option value="">{t('form.subject.selectPlaceholder')}</option>
                <option value="general_inquiry">{t('form.subject.options.general')}</option>
                <option value="technical_support">{t('form.subject.options.support')}</option>
                <option value="billing_question">{t('form.subject.options.billing')}</option>
                {/* <option value="feedback">{t('form.subject.options.feedback')}</option> */}
                <option value="partnership">{t('form.subject.options.partnership')}</option>
                <option value="other">{t('form.subject.options.other')}</option>
              </select>
              {errors.subject && <p id="subject-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.subject}</p>}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.message.label')}</label>
              <textarea 
                id="message" 
                name="message" 
                rows={6} 
                value={formData.message}
                onChange={handleChange}
                placeholder={t('form.message.placeholder')}
                className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              {errors.message && <p id="message-error" className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.message}</p>}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('form.message.hint')}</p>
            </div>

            {/* Verification Component */}
            <div className="pt-2">
              <SimpleVerification 
                key={verificationKey}
                onVerified={handleVerification} 
                autoHide={true} 
              />
              {errors.form && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.form}</p>}
            </div>

            {/* Submit Button */}
            <div>
              <button 
                type="submit" 
                disabled={isSubmitting || !isVerified}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              >
                {isSubmitting ? t('form.button.sending') : t('form.button.send')}
              </button>
            </div>
          </form>
        )}
      </div>
        </>
      )}
    </div>
  );
}
