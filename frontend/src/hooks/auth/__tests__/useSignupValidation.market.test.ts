import { validateBusinessRegistration } from '@/config/businessRegistration';

describe('Syrian business registration validation', () => {
  test('empty value is valid (optional field)', () => {
    expect(validateBusinessRegistration('')).toEqual({ isValid: true });
  });

  test('valid formats are accepted', () => {
    expect(validateBusinessRegistration('123')).toEqual({ isValid: true });
    expect(validateBusinessRegistration('12345')).toEqual({ isValid: true });
    expect(validateBusinessRegistration('CR-12345')).toEqual({ isValid: true });
    expect(validateBusinessRegistration('ABC123')).toEqual({ isValid: true });
  });

  test('too short is invalid (minimum 3 characters)', () => {
    const result = validateBusinessRegistration('AB');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('invalid characters are rejected', () => {
    const result = validateBusinessRegistration('AB@123');
    expect(result.isValid).toBe(false);
  });
});


