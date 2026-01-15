import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  usernameOrEmailSchema,
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  ValidationMessages,
} from '../auth';

describe('Auth Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should pass for valid email', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name+tag@domain.co.uk').success).toBe(true);
    });

    it('should fail for empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.emailRequired);
      }
    });

    it('should fail for invalid email format', () => {
      const result = emailSchema.safeParse('notanemail');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.emailInvalid);
      }
    });
  });

  describe('passwordSchema', () => {
    it('should pass for valid password (8+ chars)', () => {
      expect(passwordSchema.safeParse('password123').success).toBe(true);
      expect(passwordSchema.safeParse('SecureP@ss1').success).toBe(true);
    });

    it('should fail for empty password', () => {
      const result = passwordSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.passwordRequired);
      }
    });

    it('should fail for password shorter than 8 chars', () => {
      const result = passwordSchema.safeParse('short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.passwordTooShort);
      }
    });
  });

  describe('usernameSchema', () => {
    it('should pass for valid username', () => {
      expect(usernameSchema.safeParse('john_doe').success).toBe(true);
      expect(usernameSchema.safeParse('user123').success).toBe(true);
    });

    it('should fail for empty username', () => {
      const result = usernameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.usernameRequired);
      }
    });

    it('should fail for username shorter than 3 chars', () => {
      const result = usernameSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.usernameTooShort);
      }
    });

    it('should fail for username with invalid characters', () => {
      const result = usernameSchema.safeParse('user@name');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.usernameInvalid);
      }
    });
  });

  describe('usernameOrEmailSchema', () => {
    it('should pass for any non-empty string', () => {
      expect(usernameOrEmailSchema.safeParse('username').success).toBe(true);
      expect(usernameOrEmailSchema.safeParse('test@email.com').success).toBe(true);
    });

    it('should fail for empty string', () => {
      const result = usernameOrEmailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ValidationMessages.fieldRequired);
      }
    });
  });

  describe('signInSchema', () => {
    it('should pass for valid credentials', () => {
      const result = signInSchema.safeParse({
        usernameOrEmail: 'test@example.com',
        password: 'password',
      });
      expect(result.success).toBe(true);
    });

    it('should fail for missing usernameOrEmail', () => {
      const result = signInSchema.safeParse({
        usernameOrEmail: '',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should fail for missing password', () => {
      const result = signInSchema.safeParse({
        usernameOrEmail: 'user@test.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signUpSchema', () => {
    const validData = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true,
    };

    it('should pass for valid signup data', () => {
      expect(signUpSchema.safeParse(validData).success).toBe(true);
    });

    it('should pass with optional fields', () => {
      const result = signUpSchema.safeParse({
        ...validData,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should fail when passwords do not match', () => {
      const result = signUpSchema.safeParse({
        ...validData,
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.errors.find(e => e.path.includes('confirmPassword'));
        expect(confirmPasswordError?.message).toBe(ValidationMessages.passwordsDoNotMatch);
      }
    });

    it('should fail when terms not accepted', () => {
      const result = signUpSchema.safeParse({
        ...validData,
        acceptTerms: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const termsError = result.error.errors.find(e => e.path.includes('acceptTerms'));
        expect(termsError?.message).toBe(ValidationMessages.termsRequired);
      }
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should pass for valid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'test@example.com' }).success).toBe(true);
    });

    it('should fail for invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should pass for matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should fail for non-matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newpassword123',
        confirmPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should pass for valid password change', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should fail when new password matches current', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'samepassword123',
        newPassword: 'samepassword123',
        confirmNewPassword: 'samepassword123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const samePasswordError = result.error.errors.find(e => e.path.includes('newPassword'));
        expect(samePasswordError?.message).toBe(ValidationMessages.passwordSameAsOld);
      }
    });

    it('should fail when confirm password does not match', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword',
      });
      expect(result.success).toBe(false);
    });
  });
});
