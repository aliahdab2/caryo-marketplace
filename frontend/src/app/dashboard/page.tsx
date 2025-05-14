"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');

  // Dashboard overview stats (these would normally come from an API)
  const stats = [
    {
      title: t('dashboard.activeListings'),
      value: '3',
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-800 dark:text-blue-100',
      icon: '🚗'
    },
    {
      title: t('dashboard.views'),
      value: '245',
      bg: 'bg-green-100 dark:bg-green-900',
      text: 'text-green-800 dark:text-green-100',
      icon: '👁️'
    },
    {
      title: t('dashboard.messages'),
      value: '12',
      bg: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-800 dark:text-purple-100',
      icon: '✉️'
    },
    {
      title: t('dashboard.favorites'),
      value: '8',
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-800 dark:text-amber-100',
      icon: '⭐'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        {t('dashboard.welcome')}
        {session?.user?.name ? `, ${session.user.name}` : ''}!
      </h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className={`${stat.bg} ${stat.text} rounded-lg p-6 flex items-center`}
          >
            <div className="text-2xl mr-4">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-sm">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Listings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('dashboard.recentListings')}</h2>
          <Link 
            href="/dashboard/listings"
            className="text-primary hover:underline text-sm"
          >
            {t('common.viewAll')} →
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4">{t('listings.image')}</th>
                <th className="py-3 px-4">{t('listings.title')}</th>
                <th className="py-3 px-4">{t('common.price')}</th>
                <th className="py-3 px-4">{t('listings.status')}</th>
                <th className="py-3 px-4">{t('listings.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* This would be mapped from actual data */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4">
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-600"></div>
                </td>
                <td className="py-3 px-4">Toyota Camry 2020</td>
                <td className="py-3 px-4">$25,000</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-sm text-primary hover:underline mr-3">
                    {t('common.edit')}
                  </button>
                  <button className="text-sm text-red-500 hover:underline">
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4">
                  <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-600"></div>
                </td>
                <td className="py-3 px-4">Honda Civic 2019</td>
                <td className="py-3 px-4">$18,500</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Active
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-sm text-primary hover:underline mr-3">
                    {t('common.edit')}
                  </button>
                  <button className="text-sm text-red-500 hover:underline">
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quickActions')}</h2>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/dashboard/listings/new"
            className="btn-primary py-2 px-4 rounded-lg"
          >
            {t('dashboard.createListing')}
          </Link>
          <Link 
            href="/dashboard/profile"
            className="btn-outline py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            {t('dashboard.editProfile')}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
          >
            {t('header.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
