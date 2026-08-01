import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service — Caryo Marketplace',
  description: 'The rules for using Caryo Marketplace to buy and sell vehicles.',
};

const SECTIONS: LegalSection[] = [
  { headingKey: 'termsAcceptanceHeading', bodyKey: 'termsAcceptanceBody' },
  { headingKey: 'termsEligibilityHeading', bodyKey: 'termsEligibilityBody' },
  { headingKey: 'termsAccountHeading', bodyKey: 'termsAccountBody' },
  { headingKey: 'termsListingRulesHeading', bodyKey: 'termsListingRulesBody' },
  { headingKey: 'termsProhibitedHeading', bodyKey: 'termsProhibitedBody' },
  { headingKey: 'termsOurRoleHeading', bodyKey: 'termsOurRoleBody' },
  { headingKey: 'termsFeesHeading', bodyKey: 'termsFeesBody' },
  { headingKey: 'termsContentHeading', bodyKey: 'termsContentBody' },
  { headingKey: 'termsModerationHeading', bodyKey: 'termsModerationBody' },
  { headingKey: 'termsDisclaimerHeading', bodyKey: 'termsDisclaimerBody' },
  { headingKey: 'termsLiabilityHeading', bodyKey: 'termsLiabilityBody' },
  { headingKey: 'termsTerminationHeading', bodyKey: 'termsTerminationBody' },
  { headingKey: 'termsGoverningLawHeading', bodyKey: 'termsGoverningLawBody' },
  { headingKey: 'termsChangesHeading', bodyKey: 'termsChangesBody' },
  { headingKey: 'termsContactHeading', bodyKey: 'termsContactBody' },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      titleKey="termsTitle"
      introKey="termsIntro"
      sections={SECTIONS}
    />
  );
}
