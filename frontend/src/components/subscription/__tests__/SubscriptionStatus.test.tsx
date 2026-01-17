import React from 'react';
import { render, screen } from '@testing-library/react';
import SubscriptionStatus from '../SubscriptionStatus';
import { TrialStatus } from '@/services/dealerApi';

// Mock translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string, options?: Record<string, unknown>) => {
      if (key === 'trialExpiring' && options) {
        return `Trial expires in ${options.days} days`;
      }
      if (key === 'listingsRemaining' && options) {
        return `${options.count} listings remaining`;
      }
      return defaultValue || key;
    },
  }),
}));

describe('SubscriptionStatus', () => {
  const mockStatus: TrialStatus = {
    active: true,
    inGracePeriod: false,
    daysRemaining: 14,
    listingsUsed: 5,
    listingsLimit: 15,
    listingsRemaining: 10,
    subscriptionTier: 'trial',
    subscriptionStatus: 'active',
    usagePercent: 33,
    expiresAt: '2024-01-01',
    graceEndsAt: null,
    canCreateListings: true
  };

  it('renders loading state', () => {
    const { container } = render(<SubscriptionStatus trialStatus={mockStatus} loading={true} />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('renders status information correctly', () => {
    render(<SubscriptionStatus trialStatus={mockStatus} />);
    
    expect(screen.getByText('Subscription Status')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('5 / 15')).toBeInTheDocument();
    expect(screen.getByText('Trial expires in 14 days')).toBeInTheDocument();
  });

  it('renders listings remaining correctly', () => {
    render(<SubscriptionStatus trialStatus={mockStatus} />);
    expect(screen.getByText('10 listings remaining')).toBeInTheDocument();
  });

  it('renders unlimited listings text', () => {
    const unlimitedStatus = { ...mockStatus, listingsLimit: -1 };
    render(<SubscriptionStatus trialStatus={unlimitedStatus} />);
    
    expect(screen.getByText('You have unlimited listings')).toBeInTheDocument();
    expect(screen.getByText('5 / ∞')).toBeInTheDocument();
  });

  it('uses RTL-friendly margin classes', () => {
    const { container } = render(<SubscriptionStatus trialStatus={mockStatus} />);
    expect(container.innerHTML).toContain('ms-3');
  });
});
