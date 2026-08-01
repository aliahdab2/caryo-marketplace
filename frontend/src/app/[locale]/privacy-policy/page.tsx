import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Caryo Marketplace',
  description: 'How Caryo Marketplace collects, uses, and protects your personal information.',
};

const SECTIONS: LegalSection[] = [
  { headingKey: 'privacyWhoWeAreHeading', bodyKey: 'privacyWhoWeAreBody' },
  { headingKey: 'privacyDataYouGiveHeading', bodyKey: 'privacyDataYouGiveBody' },
  { headingKey: 'privacyDataFromUseHeading', bodyKey: 'privacyDataFromUseBody' },
  { headingKey: 'privacyWhyWeUseHeading', bodyKey: 'privacyWhyWeUseBody' },
  { headingKey: 'privacyPublicHeading', bodyKey: 'privacyPublicBody' },
  { headingKey: 'privacySharingHeading', bodyKey: 'privacySharingBody' },
  { headingKey: 'privacyRetentionHeading', bodyKey: 'privacyRetentionBody' },
  { headingKey: 'privacySecurityHeading', bodyKey: 'privacySecurityBody' },
  { headingKey: 'privacyYourRightsHeading', bodyKey: 'privacyYourRightsBody' },
  { headingKey: 'privacyChildrenHeading', bodyKey: 'privacyChildrenBody' },
  { headingKey: 'privacyChangesHeading', bodyKey: 'privacyChangesBody' },
  { headingKey: 'privacyContactHeading', bodyKey: 'privacyContactBody' },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      titleKey="privacyTitle"
      introKey="privacyIntro"
      sections={SECTIONS}
    />
  );
}
