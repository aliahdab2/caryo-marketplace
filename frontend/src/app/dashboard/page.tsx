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
    <div
      style={{
        padding: "30px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ borderBottom: "1px solid #eaeaea", paddingBottom: "10px" }}>
        {t('dashboard.welcome')}
      </h1>

      <div
        style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <h2>{t('dashboard.accountInfo')}</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>
                {t('auth.username')}:
              </td>
              <td>{session?.user?.name || t('common.notAvailable')}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>{t('auth.email')}:</td>
              <td>{session?.user?.email || t('common.notAvailable')}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>{t('auth.userId')}:</td>
              <td>{session?.user?.id || t('common.notAvailable')}</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>{t('dashboard.role')}:</td>
              <td>{userRoles}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Actions</h2>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "10px",
          }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 15px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ddd",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t('header.home')}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              padding: "10px 15px",
              backgroundColor: "#ff4b4b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {t('header.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
