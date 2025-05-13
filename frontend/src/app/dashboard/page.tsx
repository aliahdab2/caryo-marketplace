"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation('common');

  // For debugging - you can remove this later
  useEffect(() => {
    console.log("Session:", session);
  }, [session]);

  if (status === "loading") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>{t('dashboard.loading')}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // This should ideally be handled by middleware, but as a fallback:
    router.push(`/auth/signin?message=${t('auth.loginToAccess')}`);
    return null;
  }

  // Get user roles as string
  const userRoles = session?.user?.roles
    ? session.user.roles.join(", ")
    : "No roles assigned";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-2xl md:text-3xl font-semibold pb-4 border-b border-gray-200 mb-6">
        {t('dashboard.welcome')}
      </h1>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
      
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.accountInfo')}</h2>
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                  {t('auth.username')}:
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-300">{session?.user?.name || t('common.notAvailable')}</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{t('auth.email')}:</td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-300">{session?.user?.email || t('common.notAvailable')}</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{t('auth.userId')}:</td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-300">{session?.user?.id || t('common.notAvailable')}</td>
              </tr>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{t('dashboard.role')}:</td>
                <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-300">{userRoles}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push("/")}
            className="btn btn-outline"
          >
            {t('header.home')}
          </button>
          <button
            onClick={() => router.push("/listings")}
            className="btn btn-primary"
          >
            {t('header.listings')}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="btn bg-red-500 hover:bg-red-600 text-white"
          >
            {t('header.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
