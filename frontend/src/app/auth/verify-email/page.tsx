"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from 'next/link';
import Image from 'next/image';
import useLazyTranslation from "@/hooks/useLazyTranslation";
import { getAuthUrl } from "@/utils/constants/api";
import { 
  EmailVerificationResponse, 
  isJwtResponse, 
  isMessageResponse,
  TEMP_AUTH_KEYS,
  AUTO_LOGIN_CONFIG 
} from "@/types/auto-login";

// Move namespaces outside component to prevent recreation on every render
const AUTH_NAMESPACES = ['auth'];

const VerifyEmailPage: React.FC = () => {
  // Lazy load the auth namespace
  useLazyTranslation(AUTH_NAMESPACES);

  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setVerificationStatus('error');
      setMessage(t('invalidVerificationToken'));
      return;
    }

    // Verify the email with the backend
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${getAuthUrl('VERIFY_EMAIL')}?token=${encodeURIComponent(token)}`);
        
        // Check if the response is JSON, otherwise show a generic error
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response from server");
        }
        
        const data: EmailVerificationResponse = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          
          // Check if response contains JWT token (auto-login) using type guard
          if (isJwtResponse(data)) {
            // Validate JWT token format (should have 3 parts separated by dots)
            const jwtParts = data.token.split('.');
            if (jwtParts.length !== 3) {
              setVerificationStatus('error');
              setMessage(t('verificationFailed'));
              return;
            }
            
            // This is a JWT response - auto-login the user
            setMessage(t('emailVerified') + ' ' + t('redirecting'));
            setEmail(data.email);
            
            // Clean up localStorage after successful verification
            if (typeof window !== 'undefined') {
              localStorage.removeItem('signup-email');
              localStorage.removeItem('signup-username');
            }
            
            // Store the JWT token temporarily in sessionStorage (more secure than localStorage)
            if (typeof window !== 'undefined') {
              // Use sessionStorage for temporary tokens (cleared when browser closes)
              sessionStorage.setItem(TEMP_AUTH_KEYS.TOKEN, data.token);
              sessionStorage.setItem(TEMP_AUTH_KEYS.USER, JSON.stringify({
                id: data.id,
                username: data.username,
                email: data.email,
                roles: data.roles || []
              }));
              
              // Set expiration time using config
              const expirationTime = Date.now() + (AUTO_LOGIN_CONFIG.TEMP_TOKEN_EXPIRY_MINUTES * 60 * 1000);
              sessionStorage.setItem(TEMP_AUTH_KEYS.EXPIRES, expirationTime.toString());
            }
            
            // Auto-redirect to homepage after configured delay
            setTimeout(() => {
              router.push('/?auto-login=true');
            }, AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
            
          } else if (isMessageResponse(data)) {
            // Regular message response (already verified case)
            setMessage(data.message || t('emailVerified'));
            
            let userEmail = '';
            if (data.email) {
              userEmail = data.email;
              setEmail(userEmail);
            }

            // Clean up localStorage after successful verification
            if (typeof window !== 'undefined') {
              localStorage.removeItem('signup-email');
              localStorage.removeItem('signup-username');
            }

            // For already verified users, we need to get a fresh JWT token for auto-login
            // This ensures they get logged in automatically like new verifications
            console.log('Email already verified, attempting to get fresh JWT for auto-login...');
            
            // Try to get a fresh JWT token by making another verification request
            // This should return a JWT response for already verified users
            setTimeout(async () => {
              try {
                const token = searchParams.get('token');
                if (token) {
                  const freshResponse = await fetch(`${getAuthUrl('VERIFY_EMAIL')}?token=${encodeURIComponent(token)}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });

                  if (freshResponse.ok) {
                    const freshData = await freshResponse.json();
                    
                    // Check if we now get a JWT response
                    if (isJwtResponse(freshData)) {
                      console.log('Got fresh JWT for already verified user, proceeding with auto-login...');
                      
                      // Store the JWT token temporarily in sessionStorage
                      if (typeof window !== 'undefined') {
                        const expirationTime = Date.now() + (AUTO_LOGIN_CONFIG.TEMP_TOKEN_EXPIRY_MINUTES * 60 * 1000);
                        sessionStorage.setItem(TEMP_AUTH_KEYS.TOKEN, freshData.token);
                        sessionStorage.setItem(TEMP_AUTH_KEYS.USER, JSON.stringify({
                          id: freshData.id,
                          username: freshData.username,
                          email: freshData.email,
                          roles: freshData.roles,
                        }));
                        sessionStorage.setItem(TEMP_AUTH_KEYS.EXPIRES, expirationTime.toString());
                      }
                      
                      // Redirect to auto-login
                      router.push('/?auto-login=true');
                      return;
                    }
                  }
                }
                
                // If we can't get a fresh JWT, just redirect to home page
                console.log('Could not get fresh JWT, redirecting to home page...');
                router.push('/');
                
              } catch (error) {
                console.error('Error getting fresh JWT:', error);
                router.push('/');
              }
            }, AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS);
          }

        } else {
          console.error('❌ Email verification failed:', data);
          setVerificationStatus('error');
          setMessage(data.message || t('verificationFailed'));
        }
      } catch (error) {
        console.error('❌ Error during email verification request:', error);
        setVerificationStatus('error');
        setMessage(t('verificationError'));
      }
    };

    verifyEmail();
  }, [searchParams, t, router]);

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'loading':
        return t('verifying');
      case 'success':
        return t('emailVerified');
      case 'error':
        return t('verificationFailed');
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'from-blue-600 to-blue-800';
      case 'success':
        return 'from-green-600 to-green-800';
      case 'error':
        return 'from-red-600 to-red-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left section - Brand/imagery */}
      <div className={`hidden md:flex md:w-2/5 lg:w-1/3 xl:w-1/4 bg-gradient-to-r ${getStatusColor()} text-white flex-col justify-between relative overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-5" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="verifyEmailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M0,800 C150,700 350,750 500,800 C650,850 850,800 1000,900 L1000,1000 L0,1000 Z" fill="url(#verifyEmailGradient)" />
            <path d="M0,900 C150,800 350,850 500,900 C650,950 850,900 1000,950 L1000,1000 L0,1000 Z" fill="url(#verifyEmailGradient)" opacity="0.5" />
          </svg>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center mb-6">
            <Image 
              src="/images/logo.svg" 
              alt={t('logo')}
              width={40} 
              height={40} 
              className="mr-2 md:mr-3 w-8 h-8 md:w-10 md:h-10 object-contain filter invert" 
            />
            <h1 className="text-lg md:text-xl font-bold">{t('appName')}</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{getStatusTitle()}</h2>
          <p className="text-sm md:text-base opacity-80">
            {verificationStatus === 'success' 
              ? t('emailVerificationSuccess') 
              : verificationStatus === 'error'
              ? t('emailVerificationError')
              : t('verifyingEmail')
            }
          </p>
        </div>
        
        <div className="z-10 p-6 md:p-8 lg:p-10 text-sm">
          <p className="mb-2 opacity-80">&copy; {new Date().getFullYear()} {t('appName')}</p>
          <p className="opacity-60">{t('privacy_policy')} • {t('terms_of_service')}</p>
        </div>
      </div>
      
      {/* Right section - Verification result */}
      <div className="flex-1 flex justify-center items-center p-4 md:p-6 lg:p-8 xl:p-10">
        <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center">
              <Image src="/images/logo.svg" alt={t('logo')} width={40} height={40} className="mr-2.5 sm:mr-3 w-8 h-8 sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-xl font-bold">{t('appName')}</h1>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-4 sm:p-6 md:p-8 lg:p-10 border border-gray-200 dark:border-gray-700">
            {/* Status Icon */}
            <div className="text-center mb-6">
              {getStatusIcon()}
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{getStatusTitle()}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {message}
              </p>
              {email && verificationStatus === 'success' && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  {t('verificationEmailSentTo')} <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                </p>
              )}
            </div>

            {/* Success Instructions */}
            {verificationStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">{t('nextSteps')}</h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• {t('emailVerificationComplete')}</li>
                  <li>• {t('canNowSignIn')}</li>
                  <li>• {t('accessAllFeatures')}</li>
                </ul>
              </div>
            )}

            {/* Error Instructions */}
            {verificationStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">{t('troubleshooting')}</h3>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• {t('checkLinkExpiry')}</li>
                  <li>• {t('requestNewVerification')}</li>
                  <li>• {t('contactSupportIfNeeded')}</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {verificationStatus === 'success' && (
                <Link
                  href={`/?verified=true${email ? `&username=${encodeURIComponent(email)}` : ''}`}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  {t('signInNow')}
                </Link>
              )}
              
              {verificationStatus === 'error' && (
                <Link
                  href="/auth/check-email"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {t('requestNewVerification')}
                </Link>
              )}
              
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t('backToHome')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;