import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionPlanCard from '../SubscriptionPlanCard';

// Mock translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('SubscriptionPlanCard', () => {
  const defaultProps = {
    name: 'Basic',
    price: '99 USD',
    period: 'mo',
    features: ['Feature 1', 'Feature 2'],
    isCurrentPlan: false,
    onUpgrade: jest.fn(),
    tierKey: 'basic'
  };

  it('renders plan details correctly', () => {
    render(<SubscriptionPlanCard {...defaultProps} />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('99 USD')).toBeInTheDocument();
    expect(screen.getByText('/mo')).toBeInTheDocument();
    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });

  it('renders "Current Plan" button disabled when isCurrentPlan is true', () => {
    render(<SubscriptionPlanCard {...defaultProps} isCurrentPlan={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Current Plan');
  });

  it('renders "Upgrade" button enabled when not current plan', () => {
    render(<SubscriptionPlanCard {...defaultProps} isCurrentPlan={false} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('Upgrade');
  });

  it('calls onUpgrade when Upgrade button is clicked', () => {
    render(<SubscriptionPlanCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onUpgrade).toHaveBeenCalled();
  });

  it('renders Recommended badge when recommended prop is true', () => {
    render(<SubscriptionPlanCard {...defaultProps} recommended={true} />);
    
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });

  it('uses RTL-friendly margin classes', () => {
    const { container } = render(<SubscriptionPlanCard {...defaultProps} />);
    
    // Check for logical margin classes like ms-1, me-2
    // We search the HTML string because testing-library focuses on accessibility/text
    expect(container.innerHTML).toContain('ms-1');
    expect(container.innerHTML).toContain('me-2');
  });
});
