import { 
  validatePassword, 
  getPasswordRequirements, 
  getPasswordError 
} from '../passwordValidation';

describe('Password Validation Utils', () => {
  describe('validatePassword', () => {
    describe('Valid passwords', () => {
      const validPasswords = [
        'Ali123123', // User example - uppercase + lowercase + digits
        'MySecret', // Uppercase + lowercase
        'mysecret456', // Lowercase + digits  
        'MYSECRET!!!', // Uppercase + special
        'password456', // Lowercase + digits
        'PASSWORD!!!', // Uppercase + special
        'MySecret123!', // All 4 character types
        'Test@123', // Mixed case + special + digits
        'Hello123', // Mixed case + digits
        'Secret!@#', // Mixed case + special
      ];

      validPasswords.forEach(password => {
        it(`should validate "${password}" as valid`, () => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });
    });

    describe('Invalid passwords', () => {
      const invalidTestCases = [
        {
          password: '',
          expectedError: 'Password cannot be empty',
          description: 'empty password'
        },
        {
          password: '   ',
          expectedError: 'Password cannot be empty',
          description: 'whitespace only password'
        },
        {
          password: 'short',
          expectedError: 'Password must be at least 8 characters long',
          description: 'too short password'
        },
        {
          password: 'a'.repeat(129),
          expectedError: 'Password must not exceed 128 characters',
          description: 'too long password'
        },
        {
          password: 'password',
          expectedError: 'Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)',
          description: 'common weak password'
        },
        {
          password: '123456',
          expectedError: 'Password must be at least 8 characters long',
          description: 'common numeric password'
        },
        {
          password: 'admin',
          expectedError: 'Password must be at least 8 characters long',
          description: 'short common password'
        },
        {
          password: 'lowercase',
          expectedError: 'Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)',
          description: 'only lowercase letters'
        },
        {
          password: 'UPPERCASE',
          expectedError: 'Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)',
          description: 'only uppercase letters'
        },
        {
          password: '12345678',
          expectedError: 'Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)',
          description: 'only digits'
        },
        {
          password: '!@#$%^&*',
          expectedError: 'Password must contain at least 2 different character types (lowercase, uppercase, numbers, or special characters)',
          description: 'only special characters'
        },
        // Note: MySecretaaaa123 actually passes validation as it has 3 character types
        // and only 4 repeated 'a's which is exactly at the limit
      ];

      invalidTestCases.forEach(({ password, expectedError, description }) => {
        it(`should validate ${description} as invalid`, () => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(expectedError);
        });
      });
    });

    describe('Character type counting', () => {
      it('should correctly count character types', () => {
        const testCases = [
          { password: 'password', types: 1 }, // lowercase only
          { password: 'Password', types: 2 }, // lowercase + uppercase
          { password: 'password123', types: 2 }, // lowercase + digits
          { password: 'Password123', types: 3 }, // lowercase + uppercase + digits
          { password: 'Password123!', types: 4 }, // all 4 types
          { password: 'PASS123!', types: 3 }, // uppercase + digits + special
        ];

        testCases.forEach(({ password, types }) => {
          const requirements = getPasswordRequirements(password);
          expect(requirements.characterTypeCount).toBe(types);
          expect(requirements.hasEnoughTypes).toBe(types >= 2);
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle null password', () => {
        const result = validatePassword(null as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password cannot be empty');
      });

      it('should handle undefined password', () => {
        const result = validatePassword(undefined as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password cannot be empty');
      });

      it('should trim whitespace', () => {
        const result = validatePassword('  MySecret123  ');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle password at exact length limits', () => {
        const minLengthPassword = 'MySecret'; // exactly 8 chars
        const maxLengthPassword = 'A'.repeat(127) + '1'; // exactly 128 chars

        expect(validatePassword(minLengthPassword).isValid).toBe(true);
        expect(validatePassword(maxLengthPassword).isValid).toBe(true);
      });
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return correct requirements for empty password', () => {
      const requirements = getPasswordRequirements('');
      
      expect(requirements.hasMinLength).toBe(false);
      expect(requirements.hasMaxLength).toBe(true);
      expect(requirements.hasLowercase).toBe(false);
      expect(requirements.hasUppercase).toBe(false);
      expect(requirements.hasDigit).toBe(false);
      expect(requirements.hasSpecialChar).toBe(false);
      expect(requirements.characterTypeCount).toBe(0);
      expect(requirements.hasEnoughTypes).toBe(false);
    });

    it('should return correct requirements for valid password', () => {
      const requirements = getPasswordRequirements('MySecret123!');
      
      expect(requirements.hasMinLength).toBe(true);
      expect(requirements.hasMaxLength).toBe(true);
      expect(requirements.hasLowercase).toBe(true);
      expect(requirements.hasUppercase).toBe(true);
      expect(requirements.hasDigit).toBe(true);
      expect(requirements.hasSpecialChar).toBe(true);
      expect(requirements.characterTypeCount).toBe(4);
      expect(requirements.hasEnoughTypes).toBe(true);
    });

    it('should detect special characters correctly', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const password = `Test${specialChars}123`;
      
      const requirements = getPasswordRequirements(password);
      expect(requirements.hasSpecialChar).toBe(true);
    });
  });

  describe('getPasswordError', () => {
    it('should return first error for invalid password', () => {
      const error = getPasswordError('short');
      expect(error).toBe('Password must be at least 8 characters long');
    });

    it('should return null for valid password', () => {
      const error = getPasswordError('MySecret123');
      expect(error).toBeNull();
    });

    it('should return first error when multiple errors exist', () => {
      const error = getPasswordError(''); // Empty password
      expect(error).toBe('Password cannot be empty');
    });
  });

  describe('Backend compatibility', () => {
    it('should match backend validation for user example', () => {
      // This is the user's example that should work
      const result = validatePassword('Ali123123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that backend would reject', () => {
      const backendRejectCases = [
        'password', // common weak
        '123456', // common weak
        'admin', // too short
        'onlyletters', // only one character type
        '12345678', // only digits
        'ONLYUPPER', // only uppercase
        '!@#$%^&*', // only special
      ];

      backendRejectCases.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
      });
    });

    it('should accept passwords that backend would accept', () => {
      const backendAcceptCases = [
        'Ali123123', // user example
        'MySecret', // 2 types: upper + lower
        'mysecret456', // 2 types: lower + digits
        'PASSWORD!!!', // 2 types: upper + special
        'MySecret123!', // 4 types
      ];

      backendAcceptCases.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
