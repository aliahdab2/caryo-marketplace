"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { authService } from "@/services/auth";

export default function SignUpPage() {
  const [username, setUsername] = useState(""); // Changed from name to username
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const { t } = useTranslation('common');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    
    // Basic validation
    if (!username || !email || !password) {
      setError(t('common.error'));
      return;
    }

    if (password.length < 6) {
      setError(t('common.error'));
      return;
    }

    setLoading(true);

    try {
      // Call our auth service to register the user
      const result = await authService.signup({
        username,
        email,
        password,
      });

      setSuccessMessage(result.message || t('auth.signupSuccess'));
      
      // Short delay to show the success message before signing in
      setTimeout(async () => {
        // If registration is successful, sign in the user
        try {
          const signInResult = await signIn("credentials", {
            redirect: false,
            username,
            password,
          });

          if (signInResult?.error) {
            setError(signInResult.error);
            setLoading(false);
          } else if (signInResult?.ok) {
            router.push("/dashboard"); // Redirect to dashboard after successful registration and sign-in
          }
        } catch (signInError) {
          setError("Sign in failed after registration. Please try signing in manually.");
          setLoading(false);
        }
      }, 1500);
    } catch (err: any) {
      // Display the error message from the server if available
      setError(
        err.data?.message || 
        err.message || 
        "Registration failed. Please try again."
      );
      setLoading(false);
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        {t('auth.signup')}
      </h1>
      
      <form onSubmit={handleSubmit}>
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-md mb-6" role="alert">
            <p className="text-sm">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md mb-6" role="alert">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label
            htmlFor="username"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('auth.username')}
          </label>
          <input
            id="username"
            type="text"
            className="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            placeholder={t('auth.username')}
          />
        </div>
        
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            className="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="example@email.com"
          />
        </div>
        
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            className="form-control w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading}
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('common.loading')}
            </span>
          ) : (
            t('auth.signup')
          )}
        </button>
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.alreadyHaveAccount')}{" "}
        <a
          href="/auth/signin"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t('auth.signin')}
        </a>
      </p>
    </div>
  );
}
