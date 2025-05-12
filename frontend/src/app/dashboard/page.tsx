"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // For debugging - you can remove this later
  useEffect(() => {
    console.log("Session:", session);
  }, [session]);

  if (status === "loading") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    // This should ideally be handled by middleware, but as a fallback:
    router.push("/auth/signin");
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
        User Dashboard
      </h1>

      <div
        style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <h2>User Profile</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>
                Username:
              </td>
              <td>{session?.user?.name || "Not available"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>Email:</td>
              <td>{session?.user?.email || "Not available"}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>User ID:</td>
              <td>{session?.user?.id || "Not available"}</td>
            </tr>
            <tr>
              <td style={{ padding: "10px 0", fontWeight: "bold" }}>Roles:</td>
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
            Go to Home
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
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
