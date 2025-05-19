"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
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
  MdAnalytics,
  MdSupportAgent,
  MdAdd
} from "react-icons/md";

// Navigation item type
type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  tooltip: string;
};

// Memoized Sidebar component for improved performance
const SidebarItem = memo(function SidebarItem({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick?: () => void;
}) {
  return (
  <li>
    <Link 
      href={item.href}
      onClick={onClick}
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

// Memoized User profile component with improved styling
type UserProfileSession = {
  user?: {
    name?: string | null;
    email?: string | null;
  };
} | null;

const UserProfile = memo(function UserProfile({ 
  session, 
  t 
}: { 
  session: UserProfileSession; 
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center mb-4 group">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm
                    group-hover:scale-105 transition-transform duration-200">
        {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="ml-3 overflow-hidden">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">
          {session?.user?.name || t('guest')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {session?.user?.email || ''}
        </p>
      </div>
    </div>
  );
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle authentication redirection with a consistent user experience
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?message=${encodeURIComponent(t('auth.loginToAccess'))}`);
    }
  }, [status, router, t]);

  // Toggle mobile menu with a useCallback to prevent unnecessary re-renders
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Clean up any side effects when component unmounts
  useEffect(() => {
    return () => {
      // Any cleanup code here if needed
    };
  }, []);

  // Loading state with improved spinner
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  // Enhanced sidebar items with tooltips and additional sections
  const sidebarItems = [
    // Main navigation
    { 
      name: t('dashboard.overview'), 
      href: "/dashboard", 
      icon: <MdDashboard className="text-xl" />,
      tooltip: t('dashboard.overviewTooltip') || 'Dashboard overview'
    },
    { 
      name: t('dashboard.myListings'), 
      href: "/dashboard/listings", 
      icon: <MdDirectionsCar className="text-xl" />,
      tooltip: t('dashboard.myListingsTooltip') || 'Manage your vehicle listings'
    },
    { 
      name: t('dashboard.favorites'), 
      href: "/dashboard/favorites", 
      icon: <MdFavorite className="text-xl" />,
      tooltip: t('dashboard.favoritesTooltip') || 'Your saved vehicles'
    },
    { 
      name: t('dashboard.messages'), 
      href: "/dashboard/messages", 
      icon: <MdEmail className="text-xl" />,
      tooltip: t('dashboard.messagesTooltip') || 'Your messages'
    },
    { 
      name: t('dashboard.profile'), 
      href: "/dashboard/profile", 
      icon: <MdPerson className="text-xl" />,
      tooltip: t('dashboard.profileTooltip') || 'Manage your profile'
    },
    { 
      name: t('dashboard.settings'), 
      href: "/dashboard/settings", 
      icon: <MdSettings className="text-xl" />,
      tooltip: t('dashboard.settingsTooltip') || 'Account settings'
    },
  ];

  // Quick action items
  const quickActionItems: NavItem[] = [
    {
      name: t('dashboard.addListing'),
      href: "/dashboard/listings/new",
      icon: <MdAdd className="text-xl" />,
      tooltip: t('dashboard.createListing') || 'Create a new listing'
    },
    {
      name: t('dashboard.analytics'),
      href: "/dashboard/analytics",
      icon: <MdAnalytics className="text-xl" />,
      tooltip: t('dashboard.performance') || 'View your analytics'
    },
    {
      name: t('dashboard.support'),
      href: "/dashboard/support",
      icon: <MdSupportAgent className="text-xl" />,
      tooltip: t('dashboard.helpCenter') || 'Get support'
    }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Nav Toggle - Enhanced with brand color and improved accessibility */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow sticky top-0 z-40">
        <h1 className="text-lg font-semibold flex items-center">
          <MdDashboard className="mr-2 text-primary" /> 
          {t('dashboard.dashboard')}
        </h1>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="flex items-center justify-center h-10 w-10 text-gray-700 dark:text-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full 
                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            aria-label={t('notifications')}
          >
            <MdNotifications size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Menu Toggle */}
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

      {/* Sidebar - Mobile (hidden by default, shown when toggled) */}
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
        aria-label={t('dashboard.navigation')}
      >
        {/* Mobile User Profile */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <UserProfile session={session} t={t} />
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {/* Main Navigation */}
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <SidebarItem 
                  key={item.href}
                  item={item}
                  isActive={isActive}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              );
            })}
            
            {/* Quick Actions Section */}
            <li className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('dashboard.quickActions')}
              </h2>
              <ul className="space-y-1">
                {quickActionItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  );
                })}
              </ul>
            </li>
            
            {/* Logout */}
            <li className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center w-full p-3 text-red-500 rounded-lg 
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 
                         hover:shadow-sm"
                aria-label={t('header.logout')}
              >
                <MdLogout className="mr-3 text-xl" />
                <span>{t('header.logout')}</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-sm 
                      border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 
                      transition-all duration-300">
        {/* Header with gradient */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 
                     bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/70">
          <h1 className="text-xl font-semibold flex items-center">
            <MdDashboard className="mr-2 text-primary" /> 
            {t('dashboard.dashboard')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {session?.user?.name 
              ? `${t('dashboard.welcome')}, ${session.user.name}!` 
              : t('dashboard.welcome')}
          </p>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600" 
            aria-label={t('dashboard.mainNavigation')}>
          <ul className="space-y-1.5">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <SidebarItem 
                  key={item.href}
                  item={item}
                  isActive={isActive}
                />
              );
            })}
          </ul>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('dashboard.quickActions')}
            </h2>
            <ul className="space-y-1">
              {quickActionItems.map(item => {
                const isActive = pathname === item.href;
                return (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                  />
                );
              })}
            </ul>
          </div>
        </nav>
        
        {/* User Profile & Logout */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 
                       bg-gray-50/50 dark:bg-gray-800/50">
          <UserProfile session={session} t={t} />
          
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center p-2 mt-2 text-red-500 rounded-lg 
                     border border-gray-200 dark:border-gray-700 hover:bg-red-50 
                     dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-sm"
            aria-label={t('header.logout')}
          >
            <MdLogout className="mr-2" />
            {t('header.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Desktop top bar with notifications and actions */}
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
              aria-label={t('dashboard.help')}
              title={t('dashboard.help')}
            >
              <MdHelp size={20} />
            </button>
          </div>
        </div>
        
        {/* Page content with proper padding */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 dark:border-gray-700 py-6 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              © {new Date().getFullYear()} Caryo Marketplace. {t('allRightsReserved')}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
