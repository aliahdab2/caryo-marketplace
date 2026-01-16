"use client";

import { signOut } from "next-auth/react";
import { useOptimizedSession } from "@/hooks/useOptimizedSession";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useAuthAwareNavigation } from '@/hooks/useAuthAwareNavigation';
import {
  MdDashboard,
  MdDirectionsCar,
  MdSettings,
  MdPerson,
  MdMenu,
  MdClose,
  MdLogout,
  MdNotifications,
  MdHelp,
  MdFavorite,
  MdEmail,
  MdSupportAgent,
  MdAdd,
  MdAdminPanelSettings,
  MdStorage,
  MdBlock,
  MdFlag,
  MdStorefront
} from "react-icons/md";
import { isAdmin } from '@/utils/auth';
import { ToastProvider } from '@/components/ui/ToastProvider';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  tooltip: string;
};

const SidebarItem = memo(function SidebarItem({
  item,
  isActive,
  onClick,
  navigate
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  navigate: (href: string) => void;
}) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigate(item.href);
  }, [item.href, onClick, navigate]);

  return (
  <li>
    <Link
      href={item.href}
      onClick={handleClick}
      className={`group flex items-center p-3 rounded-lg transition-all duration-200
        ${isActive
          ? "bg-primary/15 text-primary font-medium shadow-sm"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-0.5"}`}
      title={item.tooltip}
      aria-current={isActive ? "page" : undefined}
      data-testid={`nav-item-${item.href.replace(/\//g, '-').substring(1)}`}
    >
      <span className="mr-3 transition-transform duration-200 group-hover:scale-110">
        {item.icon}
      </span>
      <span>{item.name}</span>
      {isActive && (
        <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      )}
    </Link>
  </li>
  );
});

type UserProfileSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  isAdmin?: boolean;
  accessToken?: string;
} | null;

const UserProfile = memo(function UserProfile({
  user,
  t
}: {
  user: UserProfileSession;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center mb-4 group">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm
                    group-hover:scale-105 transition-transform duration-200">
        {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="ml-3 overflow-hidden">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">
          {user?.name || t('guest')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {user?.email || ''}
        </p>
      </div>
    </div>
  );
});

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useOptimizedSession();
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const { currentLang } = useLanguageSwitching();
  const { navigate } = useAuthAwareNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const focusedRoutes = ['/dashboard/dealer/stock', '/dashboard/account', '/dashboard/settings', '/dashboard/dealer/leads', '/dashboard/dealer/storefront'];
  const isFocusedPage = !!(pathname && focusedRoutes.some(route => pathname === route || pathname.startsWith(route + '/')));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?message=${encodeURIComponent(t('loginRequired', 'Please log in to access dashboard'))}`);
    }
  }, [status, router, t]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarItems: NavItem[] = [
    // Dealer Section
    {
      name: t('overview'),
      href: `/${currentLang}/dashboard/dealer`,
      icon: <MdDashboard className="text-xl" />,
      tooltip: t('overviewTooltip') || 'Dealer dashboard overview'
    },
    {
      name: t('stock', { defaultValue: 'My Stock' }),
      href: `/${currentLang}/dashboard/dealer/stock`,
      icon: <MdDirectionsCar className="text-xl" />,
      tooltip: t('stockTooltip', { defaultValue: 'Manage your vehicle inventory' })
    },
    {
      name: t('storefront', { defaultValue: 'Storefront' }),
      href: `/${currentLang}/dashboard/dealer/storefront`,
      icon: <MdStorefront className="text-xl" />,
      tooltip: t('storefrontTooltip', { defaultValue: 'Edit your public business profile' })
    },
    {
      name: t('leads', { defaultValue: 'Leads' }),
      href: `/${currentLang}/dashboard/dealer/leads`,
      icon: <MdEmail className="text-xl" />,
      tooltip: t('leadsTooltip', { defaultValue: 'Customer inquiries and messages' })
    },
    // Buyer Section
    {
      name: t('favorites'),
      href: `/${currentLang}/favorites`,
      icon: <MdFavorite className="text-xl" />,
      tooltip: t('favoritesTooltip') || 'Your saved vehicles'
    },
    {
      name: t('headerSavedSearches', { ns: 'common' }),
      href: `/${currentLang}/saved/alerts`,
      icon: <MdNotifications className="text-xl" />,
      tooltip: t('headerSavedSearches', { ns: 'common' }) || 'Your saved search alerts'
    },
    {
      name: t('blocked-users:title', 'Blocked Users'),
      href: `/${currentLang}/dashboard/blocked-users`,
      icon: <MdBlock className="text-xl" />,
      tooltip: t('blocked-users:subtitle', 'Manage blocked users')
    },
    // Admin Section (role-gated)
    ...(isAdmin() ? [
      {
        name: t('adminPanel', 'Admin Panel'),
        href: `/${currentLang}/dashboard/admin`,
        icon: <MdAdminPanelSettings className="text-xl" />,
        tooltip: t('adminPanelTooltip', 'Manage listings and users')
      },
      {
        name: t('dataManagement', 'Data Management'),
        href: `/${currentLang}/dashboard/admin/data-management`,
        icon: <MdStorage className="text-xl" />,
        tooltip: t('dataManagementTooltip', 'Manage car brands and models data')
      },
      {
        name: t('admin-reports:title', 'Reports Management'),
        href: `/${currentLang}/dashboard/admin/reports`,
        icon: <MdFlag className="text-xl" />,
        tooltip: t('admin-reports:subtitle', 'Review and manage user reports')
      }
    ] : []),
    // Account Section
    {
      name: t('account', { defaultValue: 'Account' }),
      href: `/${currentLang}/dashboard/account`,
      icon: <MdPerson className="text-xl" />,
      tooltip: t('accountTooltip', { defaultValue: 'Manage your account settings' })
    },
    {
      name: t('settings'),
      href: `/${currentLang}/dashboard/settings`,
      icon: <MdSettings className="text-xl" />,
      tooltip: t('settingsTooltip') || 'Account settings'
    },
  ];

  const quickActionItems: NavItem[] = [
    {
      name: t('addListing'),
      href: `/${currentLang}/dashboard/dealer/stock/new`,
      icon: <MdAdd className="text-xl" />,
      tooltip: t('createListing') || 'Create a new listing'
    },
    {
      name: t('support'),
      href: `/${currentLang}/dashboard/support`,
      icon: <MdSupportAgent className="text-xl" />,
      tooltip: t('helpCenter') || 'Get support'
    }
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
        <h1 className="text-lg font-semibold flex items-center">
          <MdDashboard className="mr-2 text-primary" />
          {t('dashboard')}
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center h-10 w-10 text-gray-700 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            aria-label={t('notifications')}
          >
            <MdNotifications size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button
            onClick={toggleMobileMenu}
            className="flex items-center justify-center h-10 w-10 text-gray-700 dark:text-gray-200
                     focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
      </header>

      <div
        className={`md:hidden bg-white dark:bg-gray-800 w-full fixed top-14 left-0 right-0 z-30
                   shadow-lg transition-all duration-300 ease-in-out ${
                     isMobileMenuOpen
                       ? "opacity-100 translate-y-0 max-h-[80vh] overflow-y-auto"
                       : "opacity-0 -translate-y-2 pointer-events-none max-h-0 overflow-hidden"
                   }`}
        aria-hidden={!isMobileMenuOpen}
        role="dialog"
        aria-modal="true"
        aria-label={t('navigation')}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <UserProfile user={user} t={t} />
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = !!(pathname && (pathname === item.href || pathname.startsWith(item.href + '/')));
              return (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  navigate={navigate}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              );
            })}

            <li className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('quickActions')}
              </h2>
              <ul className="space-y-1">
                {quickActionItems.map(item => {
                  const isActive = !!(pathname && pathname === item.href);
                  return (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      navigate={navigate}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  );
                })}
              </ul>
            </li>

            <li className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center w-full p-3 text-red-500 rounded-lg
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200
                         hover:shadow-sm"
                aria-label={t('headerLogout')}
              >
                <MdLogout className="mr-3 text-xl" />
                <span>{t('headerLogout')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {!isFocusedPage && (
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-sm
                      border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0
                      transition-all duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700
                     bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/70">
          <h1 className="text-xl font-semibold flex items-center">
            <MdDashboard className="mr-2 text-primary" />
            {t('dashboard')}
          </h1>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            aria-label={t('mainNavigation')}>
          <ul className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isActive = !!(pathname && (pathname === item.href || pathname.startsWith(item.href + '/')));
              return (
                <SidebarItem
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  navigate={navigate}
                />
              );
            })}
          </ul>

          <div className="mt-8">
            <h2 className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('quickActions')}
            </h2>
            <ul className="space-y-1">
              {quickActionItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    navigate={navigate}
                  />
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700
                       bg-gray-50/50 dark:bg-gray-800/50">
          <UserProfile user={user} t={t} />

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center p-2 mt-2 text-red-500 rounded-lg
                     border border-gray-200 dark:border-gray-700 hover:bg-red-50
                     dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-sm"
            aria-label={t('headerLogout')}
          >
            <MdLogout className="mr-2" />
            {t('headerLogout')}
          </button>
        </div>
      </aside>
      )}

      <div className="flex-1 overflow-auto">
        <div className="hidden md:flex items-center justify-end p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center justify-center h-9 w-9 text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
              aria-label={t('notifications')}
              title={t('notifications')}
            >
              <MdNotifications size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              className="flex items-center justify-center h-9 w-9 text-gray-700 dark:text-gray-300
                       focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('help')}
              title={t('help')}
            >
              <MdHelp size={20} />
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>

        <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              © {new Date().getFullYear()} Caryo Marketplace. {t('allRightsReserved')}
            </p>
          </div>
        </footer>
      </div>
    </div>
    </ToastProvider>
  );
}


