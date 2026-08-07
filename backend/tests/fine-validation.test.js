const { validateFinePayload } = require('../utils/validation');

describe('fine payload validation helpers', () => {
  test('accepts a valid fine payload', () => {
    const result = validateFinePayload({
      userId: '64c1f2e4a1b2c3d4e5f67890',
      name: 'Ali Khan',
      category: 'Attendance',
      value: 100,
    });

    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  test('rejects a missing name', () => {
    const result = validateFinePayload({
      userId: '64c1f2e4a1b2c3d4e5f67890',
      category: 'Attendance',
      value: 100,
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('name');
  });

  test('rejects an empty description for Other category', () => {
    const result = validateFinePayload({
      userId: '64c1f2e4a1b2c3d4e5f67890',
      name: 'Ali Khan',
      category: 'Other',
      value: 100,
      description: '   ',
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('Description');
  });

  test('rejects non-positive values', () => {
    const result = validateFinePayload({
      userId: '64c1f2e4a1b2c3d4e5f67890',
      name: 'Ali Khan',
      category: 'Attendance',
      value: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('positive');
  });

  test('rejects values above the maximum allowed', () => {
    const result = validateFinePayload({
      userId: '64c1f2e4a1b2c3d4e5f67890',
      name: 'Ali Khan',
      category: 'Attendance',
      value: 1000000,
    });

    expect(result.valid).toBe(false);
    expect(result.message).toContain('cannot exceed');
  });
});
