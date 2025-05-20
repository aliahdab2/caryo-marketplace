'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SimpleVerification from '@/components/auth/SimpleVerification';

export default function ContactPage() {
  const { t } = useTranslation('common');
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
      newErrors.name = t('contact.errors.nameRequired', 'Name is required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('contact.errors.nameLength', 'Name must be at least 2 characters');
    }
    
    // Email validation with improved regex for better international domain support
    if (!formData.email.trim()) {
      newErrors.email = t('contact.errors.emailRequired', 'Email address is required');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('contact.errors.emailInvalid', 'Please enter a valid email address');
    }
    
    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.errors.subjectRequired', 'Please select a subject');
    }
    
    // Message validation with improved length check
    if (!formData.message.trim()) {
      newErrors.message = t('contact.errors.messageRequired', 'Please enter your message');
    } else if (formData.message.trim().length < 20) {
      newErrors.message = t('contact.errors.messageLength', 'Your message should be at least 20 characters long');
    }
    
    // Verification check
    if (!isVerified) {
      newErrors.form = t('contact.errors.verificationRequired', 'Please complete the verification before submitting');
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
        form: t('contact.errors.verificationRequired', 'Please complete the verification before submitting')
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
      
      // No immediate redirect - let user see the success message first
      // They can click the "Back to Home" button if they want to leave
      // This is better UX than auto-redirecting
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        form: t('contact.errors.submissionFailed', 'There was a problem sending your message. Please try again.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle verification status update
  const handleVerification = (verified: boolean) => {
    setIsVerified(verified);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
                alt={t('contact.logo', 'Caryo Logo')} 
                width={40} 
                height={40} 
                className="mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10 object-contain filter invert" 
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold">{t('appName', 'Caryo Marketplace')}</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t('contact.getInTouch', 'Get In Touch')}</h2>
          <p className="text-sm md:text-base opacity-80">{t('contact.description', 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.')}</p>
          
          <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/5">
            <div className="flex items-start mb-3">
              <div className="mr-2.5 mt-0.5 text-blue-200 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-xs leading-relaxed">
                {t('contact.quickResponse', 'We aim to respond to all inquiries within 24 hours.')}
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
                {t('contact.supportHours', 'Our support team is available Monday to Friday, 9:00 AM - 5:00 PM.')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName', 'Caryo Marketplace')}</p>
          <p className="opacity-60">{t('contact.privacy_policy', 'Privacy Policy')} • {t('contact.terms_of_service', 'Terms of Service')}</p>
        </div>
      </div>
      
      {/* Right section - Contact form */}
      <div className="flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10 auth-container">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl my-auto">
          {/* Mobile logo (shown only on mobile) */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center responsive-fade-in">
              <Image 
                src="/images/logo.svg" 
                alt={t('contact.logo', 'Caryo Logo')} 
                width={40} 
                height={40} 
                className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10 dark:filter dark:invert" 
              />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName', 'Caryo Marketplace')}</h1>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 lg:p-10 auth-form">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">{t('contact.successTitle', 'Message Sent!')}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('contact.successMessage', 'Thank you for your message. We will get back to you shortly.')}</p>
                <div className="text-center mt-6">
                  <button 
                    onClick={() => router.push('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                  >
                    {t('contact.backToHome', 'Back to Home')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-1 auth-heading">{t('contact.title', 'Contact Us')}</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm auth-description">
                    {t('contact.formDescription', 'Fill in the form below and we\'ll get back to you as soon as possible.')}
                  </p>
                </div>
                
                {errors.form && (
                  <div role="alert" className="mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-200 dark:border-red-700 flex items-center text-xs sm:text-sm">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {errors.form}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className={`responsive-fade-in ${isSubmitting ? 'opacity-70 transition-opacity' : ''}`}>
                  <div className="mb-5">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.name', 'Your Name')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        placeholder={t('contact.namePlaceholder', 'Enter your full name')}
                      />
                    </div>
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  
                  <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.email', 'Email Address')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        placeholder={t('contact.emailPlaceholder', 'Enter your email address')}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div className="mb-5">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.subject', 'Subject')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                      </div>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="block w-full pl-10 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 appearance-none"
                      >
                        <option value="">{t('contact.selectSubject', 'Select a subject')}</option>
                        <option value="general">{t('contact.subjects.general', 'General Inquiry')}</option>
                        <option value="support">{t('contact.subjects.support', 'Technical Support')}</option>
                        <option value="billing">{t('contact.subjects.billing', 'Billing Question')}</option>
                        <option value="partnership">{t('contact.subjects.partnership', 'Partnership')}</option>
                        <option value="other">{t('contact.subjects.other', 'Other')}</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                  </div>
                  
                  <div className="mb-5">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('contact.message', 'Message')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        required
                        disabled={isSubmitting}
                        className="block w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                        placeholder={t('contact.messagePlaceholder', 'Write your message here...')}
                      ></textarea>
                    </div>
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('contact.messageHint', 'Please provide as much detail as possible so we can better assist you.')}
                    </p>
                  </div>
                  
                  <div className="mb-5">
                    <SimpleVerification
                      onVerified={handleVerification}
                      autoStart={true}
                    />
                  </div>
                  
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isVerified}
                      className={`w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-md text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200 ${
                        isSubmitting || !isVerified ? 'opacity-70 cursor-not-allowed' : 'hover-lift'
                      } transform active:translate-y-0`}
                      title={!isVerified ? t('contact.pleaseVerify', 'Please complete the verification first') : ""}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('sending', 'Sending...')}
                        </div>
                      ) : (
                        t('contact.send', 'Send Message')
                      )}
                    </button>
                    
                    {/* Add hint text under the button */}
                    {!isVerified && (
                      <div className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                        {t('contact.pleaseVerifyFirst', 'Please verify your device first')}
                      </div>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
          
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{t('contact.visitUs', 'Visit Us')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">123 Main Street</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Damascus, Syria</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
              <div className="flex items-start">
                <div className="mr-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{t('contact.callUs', 'Call Us')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">+963 11 123 4567</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">support@caryo-marketplace.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
