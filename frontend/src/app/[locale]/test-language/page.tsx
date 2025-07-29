"use client";

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function TestLanguagePage() {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const [htmlLang, setHtmlLang] = useState<string>('Loading...');
  const [htmlDir, setHtmlDir] = useState<string>('Loading...');

  useEffect(() => {
    // Update the displayed values after component mounts
    setHtmlLang(document.documentElement.lang);
    setHtmlDir(document.documentElement.dir);
    
    // Check again after a short delay to see if LocaleDetector updated it
    const timer = setTimeout(() => {
      setHtmlLang(document.documentElement.lang);
      setHtmlDir(document.documentElement.dir);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Language Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Current Status:</h2>
        <ul className="space-y-1 text-sm">
          <li><strong>URL Path:</strong> {pathname}</li>
          <li><strong>HTML Lang:</strong> <span id="html-lang">{htmlLang}</span></li>
          <li><strong>HTML Dir:</strong> <span id="html-dir">{htmlDir}</span></li>
          <li><strong>Translation Test:</strong> {t('common.welcome', 'Welcome')}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Language Switcher:</h2>
        <LanguageSwitcher />
        <p className="text-sm text-gray-600 mt-2">
          Click the language switcher above to test if it changes the language and navigates to the correct URL.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Links:</h2>
        <div className="space-x-4">
          <a href="/ar/test-language" className="text-blue-600 hover:underline">Arabic Test Page</a>
          <a href="/en/test-language" className="text-blue-600 hover:underline">English Test Page</a>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Check that the URL shows the correct locale (/ar/ or /en/)</li>
          <li>Wait a moment for the LocaleDetector to update the HTML lang attribute</li>
          <li>Click the language switcher and verify it navigates to the other locale</li>
          <li>Check that the HTML lang attribute updates correctly</li>
          <li>Verify that the page direction changes (RTL for Arabic, LTR for English)</li>
        </ol>
      </div>
    </div>
  );
} 