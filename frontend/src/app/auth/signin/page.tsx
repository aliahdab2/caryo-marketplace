"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [username, setUsername] = useState(""); // Changed from email to username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        username, // Changed from email to username
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/dashboard"); // Redirect to dashboard on successful sign-in
      } else {
        setError("An unknown error occurred.");
      }
    } catch (err) {
      setError("Failed to sign in.");
      console.error("Sign-in error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "white",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>{t('auth.signin')}</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="username"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
            }}
          >
            {t('auth.username')}
          </label>
          <input
            type="text" // Changed from email to text
            id="username" // Changed from email to username
            value={username} // Changed from email to username
            onChange={(e) => setUsername(e.target.value)} // Changed from setEmail to setUsername
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "5px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "500",
            }}
          >
            {t('auth.password')}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              marginTop: "5px",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#ffebee",
              color: "#d32f2f",
              borderRadius: "4px",
              marginBottom: "15px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#ccc" : "blue",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {loading ? t('common.loading') : t('auth.signin')}
        </button>
      </form>

      <p style={{ marginTop: "20px", textAlign: "center" }}>
        {t('auth.dontHaveAccount')}{" "}
        <a
          href="/auth/signup"
          style={{ color: "blue", textDecoration: "none" }}
        >
          {t('auth.signup')}
        </a>
      </p>
    </div>
  );
}
