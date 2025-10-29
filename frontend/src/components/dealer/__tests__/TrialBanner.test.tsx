import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/utils/direction';
import TrialBanner from '../TrialBanner';
import { TrialStatus } from '@/services/dealerApi';

jest.mock('react-i18next');
jest.mock('@/utils/direction');

describe('TrialBanner', () => {
  const mockT = jest.fn((key) => key);
  const mockOnUpgradeClick = jest.fn();

  const baseTrialStatus: TrialStatus = {
    isActive: true,
    isExpired: false,
    isInGracePeriod: false,
    daysRemaining: 45,
    listingsUsed: 5,
    listingsLimit: 15,
    subscriptionTier: 'trial',
    subscriptionStatus: 'active',
    trialEndDate: '2024-12-31',
    trialStartedAt: '2024-11-01',
    timezone: 'Asia/Damascus'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'en' }
    });
    (useDirection as jest.Mock).mockReturnValue({
      isRTL: false
    });
  });

  it('should not render for paid subscribers', () => {
    const paidStatus = { ...baseTrialStatus, subscriptionTier: 'basic' };
    const { container } = render(
      <TrialBanner trialStatus={paidStatus} onUpgradeClick={mockOnUpgradeClick} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render active trial banner', () => {
    render(<TrialBanner trialStatus={baseTrialStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.active.title');
    expect(mockT).toHaveBeenCalledWith('trial.active.message', { 
      days: 45, 
      listings: 10 
    });
  });

  it('should render expired trial banner', () => {
    const expiredStatus = {
      ...baseTrialStatus,
      isActive: false,
      isExpired: true,
      isInGracePeriod: false
    };

    render(<TrialBanner trialStatus={expiredStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.expired.title');
    expect(mockT).toHaveBeenCalledWith('trial.expired.message');
  });

  it('should render grace period banner', () => {
    const graceStatus = {
      ...baseTrialStatus,
      isInGracePeriod: true,
      daysRemaining: 2
    };

    render(<TrialBanner trialStatus={graceStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.grace.title');
    expect(mockT).toHaveBeenCalledWith('trial.grace.message', { days: 2 });
  });

  it('should render high usage warning', () => {
    const highUsageStatus = {
      ...baseTrialStatus,
      listingsUsed: 14, // 93% usage
      listingsLimit: 15
    };

    render(<TrialBanner trialStatus={highUsageStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.usage.high.title');
    expect(mockT).toHaveBeenCalledWith('trial.usage.high.message', {
      remaining: 1,
      total: 15
    });
  });

  it('should render low time warning', () => {
    const lowTimeStatus = {
      ...baseTrialStatus,
      daysRemaining: 5
    };

    render(<TrialBanner trialStatus={lowTimeStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.time.low.title');
    expect(mockT).toHaveBeenCalledWith('trial.time.low.message', { days: 5 });
  });

  it('should call onUpgradeClick when upgrade button is clicked', () => {
    render(<TrialBanner trialStatus={baseTrialStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    const upgradeButton = screen.getByRole('button');
    fireEvent.click(upgradeButton);
    
    expect(mockOnUpgradeClick).toHaveBeenCalledTimes(1);
  });

  it('should display progress bar', () => {
    render(<TrialBanner trialStatus={baseTrialStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    const progressBars = screen.getAllByRole('generic').filter(
      el => el.className.includes('bg-white/30')
    );
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('should display listings used information', () => {
    render(<TrialBanner trialStatus={baseTrialStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.listings.used', {
      used: 5,
      total: 15
    });
  });

  it('should display days remaining information', () => {
    render(<TrialBanner trialStatus={baseTrialStatus} onUpgradeClick={mockOnUpgradeClick} />);
    
    expect(mockT).toHaveBeenCalledWith('trial.days.remaining', { days: 45 });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TrialBanner 
        trialStatus={baseTrialStatus} 
        onUpgradeClick={mockOnUpgradeClick}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have animate-pulse class for urgent banners', () => {
    const expiredStatus = {
      ...baseTrialStatus,
      isActive: false,
      isExpired: true
    };

    const { container } = render(
      <TrialBanner trialStatus={expiredStatus} onUpgradeClick={mockOnUpgradeClick} />
    );
    
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
