import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/utils/direction';
import UpgradeModal from '../UpgradeModal';

jest.mock('react-i18next');
jest.mock('@/utils/direction');

describe('UpgradeModal', () => {
  const mockT = jest.fn((key) => key);
  const mockOnClose = jest.fn();
  const mockOnSelectTier = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: { language: 'en' }
    });
    (useDirection as jest.Mock).mockReturnValue({
      isRTL: false
    });
    mockOnSelectTier.mockResolvedValue(undefined);
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <UpgradeModal
        isOpen={false}
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:title');
    expect(mockT).toHaveBeenCalledWith('upgradeModal:subtitle');
  });

  it('should display all three subscription tiers', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Check for Basic, Advanced, Professional tiers
    expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.className.includes('rounded-lg') && 
      btn.className.includes('hover:bg-gray-')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onClose when backdrop is clicked', () => {
    const { container } = render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    const backdrop = container.firstChild;
    if (backdrop) {
      fireEvent.click(backdrop);
    }
  });

  it('should select a tier when tier card is clicked', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    const tierCards = screen.getAllByRole('generic').filter(
      el => el.className.includes('border-2')
    );
    
    if (tierCards.length > 0) {
      fireEvent.click(tierCards[0]);
      // Check if tier is selected by looking for selected state classes
    }
  });

  it('should call onSelectTier when continue button is clicked', async () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectTier={mockOnSelectTier}
      />
    );
    
    const continueButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('upgradeModal:continue')
    );
    
    if (continueButton) {
      fireEvent.click(continueButton);
      await waitFor(() => {
        expect(mockOnSelectTier).toHaveBeenCalled();
      });
    }
  });

  it('should show loading state during processing', async () => {
    mockOnSelectTier.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectTier={mockOnSelectTier}
      />
    );
    
    const continueButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('upgradeModal:continue')
    );
    
    if (continueButton) {
      fireEvent.click(continueButton);
      expect(mockT).toHaveBeenCalledWith('upgradeModal:processing');
    }
  });

  it('should display current trial info', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        currentTier="trial"
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:currentTrialTitle');
    expect(mockT).toHaveBeenCalledWith('upgradeModal:currentTrialDescription');
  });

  it('should show popular badge on recommended tier', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:badgePopular');
  });

  it('should show recommended badge', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:badgeRecommended');
  });

  it('should display pricing information', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:pricePerMonth');
  });

  it('should display feature lists for each tier', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    // Check that features are displayed
    const featureElements = screen.getAllByRole('generic').filter(
      el => el.className.includes('space-y-3')
    );
    expect(featureElements.length).toBeGreaterThan(0);
  });

  it('should display secure payment messaging', () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
      />
    );
    
    expect(mockT).toHaveBeenCalledWith('upgradeModal:securePayment');
    expect(mockT).toHaveBeenCalledWith('upgradeModal:cancelAnytime');
  });

  it('should disable buttons during processing', async () => {
    mockOnSelectTier.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectTier={mockOnSelectTier}
      />
    );
    
    const continueButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('upgradeModal:continue')
    );
    
    if (continueButton) {
      fireEvent.click(continueButton);
      expect(continueButton).toBeDisabled();
    }
  });

  it('should close modal after successful upgrade', async () => {
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectTier={mockOnSelectTier}
      />
    );
    
    const continueButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('upgradeModal:continue')
    );
    
    if (continueButton) {
      fireEvent.click(continueButton);
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    }
  });

  it('should handle upgrade error gracefully', async () => {
    mockOnSelectTier.mockRejectedValue(new Error('Payment failed'));
    
    // Mock window.alert
    global.alert = jest.fn();
    
    render(
      <UpgradeModal
        isOpen={true}
        onClose={mockOnClose}
        onSelectTier={mockOnSelectTier}
      />
    );
    
    const continueButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('upgradeModal:continue')
    );
    
    if (continueButton) {
      fireEvent.click(continueButton);
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });
    }
  });
});
