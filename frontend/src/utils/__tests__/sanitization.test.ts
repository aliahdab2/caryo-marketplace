import { smartSanitize, sanitizeCore } from '../sanitization/core';

describe('Sanitization - Space Handling', () => {
  describe('smartSanitize', () => {
    it('preserves normal spaces in text', () => {
      const input = 'This is a normal description with spaces';
      const result = smartSanitize(input);
      expect(result).toBe('This is a normal description with spaces');
    });

    it('preserves multiple spaces but reduces excessive ones', () => {
      const input = 'This   has   some   extra   spaces';
      const result = smartSanitize(input);
      expect(result).toBe('This  has  some  extra  spaces');
    });

    it('handles mixed content with spaces', () => {
      const input = 'Description: This car is in excellent condition.   Very clean interior.';
      const result = smartSanitize(input);
      expect(result).toBe('Description: This car is in excellent condition.  Very clean interior.');
    });

    it('removes HTML but preserves spaces', () => {
      const input = 'This is a <script>alert("test")</script> description with spaces';
      const result = smartSanitize(input);
      expect(result).toBe('This is a  description with spaces');
    });

    it('handles empty string', () => {
      const result = smartSanitize('');
      expect(result).toBe('');
    });

    it('handles string with only spaces', () => {
      const result = smartSanitize('   ');
      expect(result).toBe('');
    });
  });

  describe('sanitizeCore', () => {
    it('preserves normal spaces in standard mode', () => {
      const input = 'This is a normal description with spaces';
      const result = sanitizeCore(input, 'standard');
      expect(result).toBe('This is a normal description with spaces');
    });

    it('reduces excessive spaces but preserves normal ones', () => {
      const input = 'This   has   some   extra   spaces';
      const result = sanitizeCore(input, 'standard');
      expect(result).toBe('This  has  some  extra  spaces');
    });
  });
}); 