"use client";

// Disable static generation for this page since it uses session data
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useOptimizedSession } from "@/hooks/useOptimizedSession";
import Link from "next/link";
import {
  MdHelp,
  MdContactSupport,
  MdBugReport,
  MdSecurity,
  MdDirectionsCar,
  MdNotifications,
  MdSettings,
  MdChat,
  MdEmail,
  MdArrowForward,
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdAccessTime
} from "react-icons/md";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function SupportPage() {
  const { t } = useTranslation('dashboard');
  const { currentLang } = useLanguageSwitching();
  const { user } = useOptimizedSession();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock FAQ data - would come from API in real implementation
  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create a new car listing?',
      answer: 'Go to Dashboard > Add Listing, fill in your car details, upload photos, and submit for review. Your listing will be live once approved.',
      category: 'listings'
    },
    {
      id: '2',
      question: 'Why was my listing rejected?',
      answer: 'Common reasons include: incomplete information, poor quality photos, suspicious pricing, or policy violations. Check your email for specific feedback.',
      category: 'listings'
    },
    {
      id: '3',
      question: 'How do saved search alerts work?',
      answer: 'Create search criteria and get notified when new cars match your filters. You can manage alerts from the Saved Searches section.',
      category: 'alerts'
    },
    {
      id: '4',
      question: 'Can I edit my listing after it\'s published?',
      answer: 'Yes, go to My Listings and click Edit. Major changes may require re-approval.',
      category: 'listings'
    },
    {
      id: '5',
      question: 'How do I report a suspicious user?',
      answer: 'Use the Report button on their profile or listing, or contact support directly with details.',
      category: 'safety'
    },
    {
      id: '6',
      question: 'How can I make my listing more visible?',
      answer: 'Use high-quality photos, complete all fields, competitive pricing, and consider premium features for better visibility.',
      category: 'listings'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: <MdHelp /> },
    { id: 'listings', name: 'Listings', icon: <MdDirectionsCar /> },
    { id: 'alerts', name: 'Alerts', icon: <MdNotifications /> },
    { id: 'safety', name: 'Safety', icon: <MdSecurity /> },
    { id: 'account', name: 'Account', icon: <MdSettings /> }
  ];

  const quickActions = [
    {
      title: 'Report a Problem',
      description: 'Issue with your listing or account',
      icon: <MdBugReport className="text-red-500" />,
      href: '/contact?subject=technical_support',
      color: 'red'
    },
    {
      title: 'Account Security',
      description: 'Password, login, or security concerns',
      icon: <MdSecurity className="text-blue-500" />,
      href: '/contact?subject=account_security',
      color: 'blue'
    },
    {
      title: 'Listing Help',
      description: 'Get help with creating or managing listings',
      icon: <MdDirectionsCar className="text-green-500" />,
      href: '/dashboard/listings/new',
      color: 'green'
    },
    {
      title: 'Contact Support',
      description: 'Speak directly with our team',
      icon: <MdContactSupport className="text-purple-500" />,
      href: '/contact',
      color: 'purple'
    }
  ];

  const filteredFAQs = selectedCategory === 'all'
    ? faqData
    : faqData.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const getActionColorClasses = (color: string) => {
    const colorMap = {
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/30'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('support.title', 'Help & Support')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {t('support.subtitle', 'Get help with your account and listings')}
          {user?.name && (
            <span className="font-medium"> • Welcome, {user.name}</span>
          )}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('support.quickActions', 'Quick Actions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const colorClasses = getActionColorClasses(action.color);
            return (
              <Link
                key={index}
                href={action.href}
                className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover}
                          border rounded-xl p-6 transition-all duration-200 group`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-10">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
                       rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4">
            {t('support.contactInfo', 'Need Direct Support?')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <MdChat className="text-blue-600 dark:text-blue-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">Live Chat</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Available 9 AM - 6 PM</p>
              </div>
            </div>
            <div className="flex items-center">
              <MdEmail className="text-blue-600 dark:text-blue-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">Email Support</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">support@caryo.sy</p>
              </div>
            </div>
            <div className="flex items-center">
              <MdAccessTime className="text-blue-600 dark:text-blue-400 mr-3" size={20} />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">Business Hours</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Sun - Thu, 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('support.faq', 'Frequently Asked Questions')}
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <h3 className="font-medium text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </h3>
                {expandedFAQ === faq.id ? (
                  <MdExpandLess className="text-gray-500 flex-shrink-0" size={24} />
                ) : (
                  <MdExpandMore className="text-gray-500 flex-shrink-0" size={24} />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {t('support.noFAQs', 'No FAQs found for this category.')}
            </p>
          </div>
        )}
      </div>

      {/* Knowledge Base Links */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('support.guides', 'Helpful Guides')}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/${currentLang}/dashboard/listings/new`}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center">
                <MdDirectionsCar className="text-primary mr-3" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('support.guide.createListing', 'How to Create a Listing')}
                </span>
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-primary transition-colors" size={16} />
            </Link>

            <Link
              href="/saved/alerts"
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center">
                <MdNotifications className="text-primary mr-3" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('support.guide.manageAlerts', 'Managing Search Alerts')}
                </span>
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-primary transition-colors" size={16} />
            </Link>

            <Link
              href={`/${currentLang}/dashboard/settings`}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center">
                <MdSettings className="text-primary mr-3" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('support.guide.accountSettings', 'Account Settings Guide')}
                </span>
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-primary transition-colors" size={16} />
            </Link>

            <Link
              href={`/${currentLang}/dashboard/profile`}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center">
                <MdCheckCircle className="text-primary mr-3" size={20} />
                <span className="font-medium text-gray-900 dark:text-white">
                  {t('support.guide.profileOptimization', 'Profile Optimization')}
                </span>
              </div>
              <MdArrowForward className="text-gray-400 group-hover:text-primary transition-colors" size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('support.stillNeedHelp', 'Still Need Help?')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('support.contactMessage', 'Our support team is here to help you with any questions or issues.')}
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <MdContactSupport className="mr-2" size={20} />
          {t('support.contactSupport', 'Contact Support')}
        </Link>
      </div>
    </div>
  );
}