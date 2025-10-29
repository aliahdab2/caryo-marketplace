import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PasswordValidation, PasswordRequirementText, usePasswordValidation } from '../PasswordValidation';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'auth:passwordRequirements': 'Password Requirements:',
        'auth:requirementLength': 'At least 8 characters',
        'auth:requirementTwoTypes': 'At least 2 character types: letters, numbers, or symbols',
        'auth:passwordRequirement': 'At least 8 characters with 2 different character types (letters, numbers, symbols)'
      };
      return translations[key] || defaultValue || key;
    }
  })
}));

// Test component to test the hook
const TestComponent: React.FC<{ password: string }> = ({ password }) => {
  const { isValid, errors, firstError } = usePasswordValidation(password);

  return (
    <div>
      <div data-testid="is-valid">{isValid.toString()}</div>
      <div data-testid="error-count">{errors.length}</div>
      <div data-testid="first-error">{firstError || 'none'}</div>
    </div>
  );
};

describe('PasswordValidation Component', () => {
  describe('PasswordValidation', () => {
    it('should render password requirements', () => {
      render(<PasswordValidation password="" />);

      expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText(/At least 2 character types/)).toBeInTheDocument();
    });

    it('should show empty requirements for empty password', () => {
      render(<PasswordValidation password="" />);

      // Should show bullet points (•) for unmet requirements
      const bullets = screen.getAllByText('•');
      expect(bullets).toHaveLength(2); // Length + character types
    });

    it('should show checkmarks for valid password', () => {
      render(<PasswordValidation password="MySecret123" />);

      // Should show checkmarks (✓) for met requirements
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks).toHaveLength(2); // Length + character types both met
    });

    it('should show partial validation for password with only length', () => {
      render(<PasswordValidation password="password" />);

      // Length requirement met (✓), character types not met (•)
      expect(screen.getByText('✓')).toBeInTheDocument(); // Length checkmark
      expect(screen.getByText('•')).toBeInTheDocument(); // Character types bullet
    });

    it('should not render when showRequirements is false', () => {
      render(<PasswordValidation password="test" showRequirements={false} />);

      expect(screen.queryByText('Password Requirements:')).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PasswordValidation password="test" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should show character type count', () => {
      render(<PasswordValidation password="MySecret123" />);

      // Should show (3/4) for uppercase + lowercase + digits
      expect(screen.getByText(/\(3\/4\)/)).toBeInTheDocument();
    });
  });

  describe('PasswordRequirementText', () => {
    it('should render requirement text', () => {
      render(<PasswordRequirementText />);

      expect(screen.getByText('At least 8 characters with 2 different character types (letters, numbers, symbols)')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<PasswordRequirementText className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('usePasswordValidation Hook', () => {
    it('should validate empty password as invalid', () => {
      render(<TestComponent password="" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      expect(screen.getByTestId('first-error')).toHaveTextContent('Password cannot be empty');
    });

    it('should validate short password as invalid', () => {
      render(<TestComponent password="short" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      expect(screen.getByTestId('error-count')).toHaveTextContent('2'); // length + character types
      expect(screen.getByTestId('first-error')).toHaveTextContent('Password must be at least 8 characters long');
    });

    it('should validate password with only one character type as invalid', () => {
      render(<TestComponent password="password" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      expect(screen.getByTestId('error-count')).toHaveTextContent('1'); // character types only
      expect(screen.getByTestId('first-error')).toHaveTextContent('Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)');
    });

    it('should validate common weak password as invalid', () => {
      render(<TestComponent password="password" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      // Should have one error: character types (password is not flagged as common since it's 8 chars)
      expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    });

    it('should validate Ali123123 as valid', () => {
      render(<TestComponent password="Ali123123" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('first-error')).toHaveTextContent('none');
    });

    it('should validate password with 2 character types as valid', () => {
      render(<TestComponent password="MySecret" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('first-error')).toHaveTextContent('none');
    });

    it('should validate password with 3 character types as valid', () => {
      render(<TestComponent password="MySecret123" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('first-error')).toHaveTextContent('none');
    });

    it('should validate password with all 4 character types as valid', () => {
      render(<TestComponent password="MySecret123!" />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('first-error')).toHaveTextContent('none');
    });

    it('should validate too long password as invalid', () => {
      const longPassword = 'a'.repeat(129);
      render(<TestComponent password={longPassword} />);

      expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
      expect(screen.getByTestId('first-error')).toHaveTextContent('Password must not exceed 128 characters');
    });

    // Note: Excessive repeated character validation is handled by backend
    // Frontend focuses on basic validation for better UX
  });
});

describe('Password Validation Integration', () => {
  it('should match backend validation rules', () => {
    const testCases = [
      // Valid passwords
      { password: 'Ali123123', expected: true, description: 'User example password' },
      { password: 'MySecret', expected: true, description: 'Uppercase + lowercase' },
      { password: 'mysecret456', expected: true, description: 'Lowercase + digits' },
      { password: 'MYSECRET!!!', expected: true, description: 'Uppercase + special' },
      { password: 'MySecret123!', expected: true, description: 'All 4 character types' },

      // Invalid passwords
      { password: '', expected: false, description: 'Empty password' },
      { password: 'short', expected: false, description: 'Too short' },
      { password: 'password', expected: false, description: 'Common weak password' },
      { password: '12345678', expected: false, description: 'Only digits' },
      { password: 'PASSWORD', expected: false, description: 'Only uppercase' },
      // Note: Excessive repeated chars validation is handled by backend
    ];

    testCases.forEach(({ password, expected }, index) => {
      const { unmount } = render(<TestComponent password={password} key={index} />);

      const isValid = screen.getByTestId('is-valid').textContent === 'true';
      expect(isValid).toBe(expected);

      // Clean up for next test
      unmount();
    });
  });
});
