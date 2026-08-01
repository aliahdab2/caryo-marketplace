import type { Metadata } from 'next';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'About Caryo — Caryo Marketplace',
  description: 'Caryo Marketplace is a bilingual platform for buying and selling cars in Syria.',
};

const SECTIONS: LegalSection[] = [
  { headingKey: 'aboutWhatWeDoHeading', bodyKey: 'aboutWhatWeDoBody' },
  { headingKey: 'aboutWhyHeading', bodyKey: 'aboutWhyBody' },
  { headingKey: 'aboutHowItWorksHeading', bodyKey: 'aboutHowItWorksBody' },
  { headingKey: 'aboutTrustHeading', bodyKey: 'aboutTrustBody' },
  { headingKey: 'aboutBilingualHeading', bodyKey: 'aboutBilingualBody' },
  { headingKey: 'aboutContactHeading', bodyKey: 'aboutContactBody' },
];

export default function AboutPage() {
  return (
    <LegalPageLayout
      titleKey="aboutTitle"
      introKey="aboutIntro"
      sections={SECTIONS}
      // Informational page, not a policy — the legal-review caveat does not apply
      showPendingReviewNotice={false}
    />
  );
}
