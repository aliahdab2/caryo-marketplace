'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

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
    
    if (!formData.name.trim()) {
      newErrors.name = t('contact.errors.nameRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('contact.errors.emailRequired');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(formData.email)) {
      newErrors.email = t('contact.errors.emailInvalid');
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.errors.subjectRequired');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('contact.errors.messageRequired');
    } else if (formData.message.trim().length < 20) {
      newErrors.message = t('contact.errors.messageLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
      
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        form: t('contact.errors.submissionFailed')
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="my-8 md:my-12">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">{t('contact.title')}</h1>
        
        {submitSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
            <h3 className="text-green-800 text-xl font-semibold mb-2">{t('contact.successTitle')}</h3>
            <p className="text-green-700">{t('contact.successMessage')}</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-blue-800 text-xl font-semibold mb-2">{t('contact.getInTouch')}</h2>
              <p className="text-blue-700">{t('contact.description')}</p>
            </div>
            
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{errors.form}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  {t('contact.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="mt-1 text-red-500 text-sm">{errors.name}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  {t('contact.email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="mt-1 text-red-500 text-sm">{errors.email}</p>}
              </div>
              
              <div className="mb-4">
                <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                  {t('contact.subject')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isSubmitting}
                >
                  <option value="">{t('contact.selectSubject')}</option>
                  <option value="general">{t('contact.subjects.general')}</option>
                  <option value="support">{t('contact.subjects.support')}</option>
                  <option value="billing">{t('contact.subjects.billing')}</option>
                  <option value="partnership">{t('contact.subjects.partnership')}</option>
                  <option value="other">{t('contact.subjects.other')}</option>
                </select>
                {errors.subject && <p className="mt-1 text-red-500 text-sm">{errors.subject}</p>}
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                  {t('contact.message')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={isSubmitting}
                ></textarea>
                {errors.message && <p className="mt-1 text-red-500 text-sm">{errors.message}</p>}
                <p className="mt-1 text-sm text-gray-500">{t('contact.messageHint')}</p>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('sending') : t('contact.send')}
                  {isSubmitting && (
                    <span className="ml-2 inline-block animate-spin">⟳</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">{t('contact.otherWays')}</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">{t('contact.visitUs')}</h3>
              <p className="text-gray-700 mb-2">Caryo Marketplace</p>
              <p className="text-gray-700 mb-2">123 Main Street</p>
              <p className="text-gray-700">Damascus, Syria</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-3">{t('contact.callUs')}</h3>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">{t('contact.phone')}:</span> +963 11 123 4567
              </p>
              <p className="text-gray-700">
                <span className="font-medium">{t('contact.email')}:</span> support@caryo-marketplace.com
              </p>
            </div>
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-3">{t('contact.businessHours')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">{t('contact.weekdays')}</p>
                <p className="text-gray-700">9:00 AM - 5:00 PM</p>
              </div>
              <div>
                <p className="font-medium">{t('contact.weekend')}</p>
                <p className="text-gray-700">{t('contact.closed')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
