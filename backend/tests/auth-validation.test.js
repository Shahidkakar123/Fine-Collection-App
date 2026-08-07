const { validatePassword, validateEmailAddress, normalizeEmail } = require('../utils/validation');

describe('auth validation helpers', () => {
  test('accepts strong passwords with letters and numbers', () => {
    expect(validatePassword('Password1')).toEqual({ valid: true, normalized: 'Password1' });
    expect(validatePassword('abc123')).toEqual({ valid: true, normalized: 'abc123' });
  });

  test('rejects weak passwords', () => {
    expect(validatePassword('abcdef')).toEqual(expect.objectContaining({ valid: false }));
    expect(validatePassword('123456')).toEqual(expect.objectContaining({ valid: false }));
    expect(validatePassword('abc')).toEqual(expect.objectContaining({ valid: false }));
  });

  test('accepts standard email addresses', async () => {
    const result = await validateEmailAddress('user@gmail.com', { checkDomain: false });
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('user@gmail.com');
  });

  test('rejects malformed email addresses', async () => {
    const invalid = await validateEmailAddress('not-an-email', { checkDomain: false });
    const invalidDomain = await validateEmailAddress('user@', { checkDomain: false });
    expect(invalid.valid).toBe(false);
    expect(invalidDomain.valid).toBe(false);
  });

  test('normalizes email casing and whitespace', () => {
    expect(normalizeEmail('  User@Gmail.COM  ')).toBe('user@gmail.com');
  });
});
