import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy — Caryo Marketplace',
  description: 'The cookies Caryo Marketplace uses and how to control them.',
};

const SECTIONS: LegalSection[] = [
  { headingKey: 'cookiesWhatHeading', bodyKey: 'cookiesWhatBody' },
  { headingKey: 'cookiesEssentialHeading', bodyKey: 'cookiesEssentialBody' },
  { headingKey: 'cookiesPreferenceHeading', bodyKey: 'cookiesPreferenceBody' },
  { headingKey: 'cookiesAnalyticsHeading', bodyKey: 'cookiesAnalyticsBody' },
  { headingKey: 'cookiesThirdPartyHeading', bodyKey: 'cookiesThirdPartyBody' },
  { headingKey: 'cookiesManagingHeading', bodyKey: 'cookiesManagingBody' },
  { headingKey: 'cookiesChangesHeading', bodyKey: 'cookiesChangesBody' },
  { headingKey: 'cookiesContactHeading', bodyKey: 'cookiesContactBody' },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      titleKey="cookiesTitle"
      introKey="cookiesIntro"
      sections={SECTIONS}
    />
  );
}
