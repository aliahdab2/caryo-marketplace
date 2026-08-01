import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    // Echo the key back so assertions can target keys rather than copy
    t: (key: string) => key,
    ready: true,
    i18n: { language: 'en' },
  }),
}));

const LOCALE_APP_DIR = path.join(process.cwd(), 'src', 'app', '[locale]');

/**
 * Resolve an in-app href to the page file that would serve it.
 *
 * Only handles the static, non-parameterised routes the footer links to —
 * which is the point: every footer link should be a plain static page.
 */
function pageFileFor(href: string): string {
  const segments = href.split('/').filter(Boolean);
  return path.join(LOCALE_APP_DIR, ...segments, 'page.tsx');
}

describe('Footer', () => {
  describe('link integrity', () => {
    // Regression: the footer shipped links to /about, /careers, /privacy-policy,
    // /terms-of-service and /cookie-policy when none of those routes existed —
    // five 404s on every page of the site, including from the legal section.
    it('every internal link resolves to a real page', () => {
      render(<Footer />);

      const internalHrefs = screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => href !== null && href.startsWith('/'));

      expect(internalHrefs.length).toBeGreaterThan(0);

      const broken = internalHrefs.filter((href) => {
        if (href === '/') return false; // home lives at [locale]/page.tsx
        return !fs.existsSync(pageFileFor(href));
      });

      expect(broken).toEqual([]);
    });

    it('links to both the privacy policy and the terms of service', () => {
      render(<Footer />);

      const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
      expect(hrefs).toContain('/privacy-policy');
      expect(hrefs).toContain('/terms-of-service');
    });
  });

  describe('social links', () => {
    // Regression: these pointed at the bare facebook.com / instagram.com /
    // twitter.com homepages, which sends visitors nowhere useful.
    it('renders no social icons when no profile URLs are configured', () => {
      render(<Footer />);

      const externalLinks = screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => href !== null && href.startsWith('http'));

      expect(externalLinks).toEqual([]);
    });
  });

  describe('internationalisation', () => {
    // Regression: the entire footer was hardcoded English, so Arabic visitors
    // got an English footer on every page.
    it('renders no hardcoded English copy', () => {
      render(<Footer />);

      expect(screen.queryByText('Privacy Policy')).not.toBeInTheDocument();
      expect(screen.queryByText('Terms of Service')).not.toBeInTheDocument();
      expect(screen.queryByText('Company')).not.toBeInTheDocument();
      expect(screen.getByText('footerPrivacyPolicy')).toBeInTheDocument();
      expect(screen.getByText('footerCompanyHeading')).toBeInTheDocument();
    });
  });
});
