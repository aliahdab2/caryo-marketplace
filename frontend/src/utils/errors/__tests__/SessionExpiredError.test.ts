import { SessionExpiredError } from '../SessionExpiredError';

describe('SessionExpiredError', () => {
  it('should create an error with default message', () => {
    const error = new SessionExpiredError();
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SessionExpiredError);
    expect(error.message).toBe('Session expired');
    expect(error.name).toBe('SessionExpiredError');
  });

  it('should create an error with custom message', () => {
    const customMessage = 'Your session has timed out';
    const error = new SessionExpiredError(customMessage);
    
    expect(error.message).toBe(customMessage);
    expect(error.name).toBe('SessionExpiredError');
  });

  it('should have a stack trace', () => {
    const error = new SessionExpiredError();
    
    expect(error.stack).toBeDefined();
  });

  it('should be catchable as Error', () => {
    try {
      throw new SessionExpiredError('Test error');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(SessionExpiredError);
      if (e instanceof SessionExpiredError) {
        expect(e.message).toBe('Test error');
      }
    }
  });
});
