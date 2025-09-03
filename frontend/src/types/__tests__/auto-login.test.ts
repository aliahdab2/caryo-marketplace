import {
  EmailVerificationJwtResponse,
  EmailVerificationMessageResponse,
  TempAuthUser,
  AutoLoginRequest,
  AutoLoginResponse,
  isJwtResponse,
  isMessageResponse,
  isTempAuthUser,
  TEMP_AUTH_KEYS,
  AUTO_LOGIN_CONFIG,
} from '../auto-login';

describe('Auto-Login Types', () => {
  describe('Type Guards', () => {
    describe('isJwtResponse', () => {
      it('should return true for valid JWT response', () => {
        const validJwtResponse: EmailVerificationJwtResponse = {
          token: 'valid.jwt.token',
          type: 'Bearer',
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isJwtResponse(validJwtResponse)).toBe(true);
      });

      it('should return false for missing token', () => {
        const invalidResponse = {
          type: 'Bearer',
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isJwtResponse(invalidResponse)).toBe(false);
      });

      it('should return false for invalid token type', () => {
        const invalidResponse = {
          token: 123, // should be string
          type: 'Bearer',
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isJwtResponse(invalidResponse)).toBe(false);
      });

      it('should return false for invalid id type', () => {
        const invalidResponse = {
          token: 'valid.jwt.token',
          type: 'Bearer',
          id: 'invalid', // should be number
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isJwtResponse(invalidResponse)).toBe(false);
      });

      it('should return false for invalid roles type', () => {
        const invalidResponse = {
          token: 'valid.jwt.token',
          type: 'Bearer',
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: 'ROLE_USER', // should be array
        };

        expect(isJwtResponse(invalidResponse)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(isJwtResponse(null)).toBe(false);
        expect(isJwtResponse(undefined)).toBe(false);
      });
    });

    describe('isMessageResponse', () => {
      it('should return true for valid message response', () => {
        const validMessageResponse: EmailVerificationMessageResponse = {
          message: 'Email already verified',
          email: 'test@example.com',
        };

        expect(isMessageResponse(validMessageResponse)).toBe(true);
      });

      it('should return true for message response without email', () => {
        const validMessageResponse: EmailVerificationMessageResponse = {
          message: 'Email verified successfully',
        };

        expect(isMessageResponse(validMessageResponse)).toBe(true);
      });

      it('should return false for missing message', () => {
        const invalidResponse = {
          email: 'test@example.com',
        };

        expect(isMessageResponse(invalidResponse)).toBe(false);
      });

      it('should return false for response with token (JWT response)', () => {
        const jwtResponse = {
          message: 'Email verified',
          token: 'jwt.token.here',
        };

        expect(isMessageResponse(jwtResponse)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(isMessageResponse(null)).toBe(false);
        expect(isMessageResponse(undefined)).toBe(false);
      });
    });

    describe('isTempAuthUser', () => {
      it('should return true for valid temp auth user', () => {
        const validUser: TempAuthUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isTempAuthUser(validUser)).toBe(true);
      });

      it('should return true for user with multiple roles', () => {
        const validUser: TempAuthUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER', 'ROLE_ADMIN'],
        };

        expect(isTempAuthUser(validUser)).toBe(true);
      });

      it('should return true for user with empty roles array', () => {
        const validUser: TempAuthUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: [],
        };

        expect(isTempAuthUser(validUser)).toBe(true);
      });

      it('should return false for invalid id type', () => {
        const invalidUser = {
          id: 'invalid', // should be number
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isTempAuthUser(invalidUser)).toBe(false);
      });

      it('should return false for missing username', () => {
        const invalidUser = {
          id: 1,
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        };

        expect(isTempAuthUser(invalidUser)).toBe(false);
      });

      it('should return false for invalid roles type', () => {
        const invalidUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: 'ROLE_USER', // should be array
        };

        expect(isTempAuthUser(invalidUser)).toBe(false);
      });

      it('should return false for null or undefined', () => {
        expect(isTempAuthUser(null)).toBe(false);
        expect(isTempAuthUser(undefined)).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('should have correct TEMP_AUTH_KEYS', () => {
      expect(TEMP_AUTH_KEYS.TOKEN).toBe('temp-auth-token');
      expect(TEMP_AUTH_KEYS.USER).toBe('temp-auth-user');
      expect(TEMP_AUTH_KEYS.EXPIRES).toBe('temp-auth-expires');
    });

    it('should have correct AUTO_LOGIN_CONFIG', () => {
      expect(AUTO_LOGIN_CONFIG.TEMP_TOKEN_EXPIRY_MINUTES).toBe(5);
      expect(AUTO_LOGIN_CONFIG.REDIRECT_DELAY_MS).toBe(2000);
      expect(AUTO_LOGIN_CONFIG.SESSION_EXPIRY_HOURS).toBe(24);
    });
  });

  describe('Interface Compliance', () => {
    it('should accept valid AutoLoginRequest', () => {
      const request: AutoLoginRequest = {
        token: 'valid.jwt.token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          roles: ['ROLE_USER'],
        },
      };

      expect(request.token).toBe('valid.jwt.token');
      expect(request.user.id).toBe(1);
    });

    it('should accept valid AutoLoginResponse success', () => {
      const response: AutoLoginResponse = {
        success: true,
      };

      expect(response.success).toBe(true);
      expect(response.error).toBeUndefined();
    });

    it('should accept valid AutoLoginResponse error', () => {
      const response: AutoLoginResponse = {
        success: false,
        error: 'Authentication failed',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Authentication failed');
    });
  });
});
