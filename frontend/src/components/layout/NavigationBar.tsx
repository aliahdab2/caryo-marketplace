"use client";
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { FaUserCircle } from 'react-icons/fa';

const NavigationBar = () => {
  const { t } = useTranslation('common');
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <Link href="/" className="hover:text-gray-300">Caryo</Link>
        </div>

        {/* Navigation Links */}
        <ul className="hidden md:flex space-x-4 items-center">
          <li><Link href="/cars/used" className="hover:text-gray-300">{t('nav.usedCars', 'Used Cars')}</Link></li>
          <li><Link href="/cars/new" className="hover:text-gray-300">{t('nav.newCars', 'New Cars')}</Link></li>
          <li><Link href="/cars/private-seller" className="hover:text-gray-300">{t('nav.privateSellerCars', 'Private Seller Cars')}</Link></li>
          <li><Link href="/sell-my-car" className="hover:text-gray-300">{t('nav.sellMyCar', 'Sell My Car')}</Link></li>
          <li><Link href="/research" className="hover:text-gray-300">{t('nav.carResearchAndTools', 'Car Research & Tools')}</Link></li>
          <li><Link href="/dealers" className="hover:text-gray-300">{t('nav.findLocalDealers', 'Find Local Dealers')}</Link></li>
        </ul>

        {/* Icons and Auth */}
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="relative">
              <Link href="/dashboard" className="hover:text-gray-300 flex items-center">
                <FaUserCircle className="mr-1 h-6 w-6" />
                {session.user?.name || t('nav.profile', 'Profile')}
              </Link>
              {/* Dropdown for profile/logout could be added here */}
            </div>
          ) : (
            <Link href="/api/auth/signin" className="hover:text-gray-300 flex items-center">
              <FaUserCircle className="mr-1 h-6 w-6" />
              {t('nav.signIn', 'Sign In')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
