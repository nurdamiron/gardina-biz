import { Email } from '../../../src/domain/value-objects/Email.js';

describe('Email Value Object', () => {
  // ---------------------------------------------------------------------------
  // Construction - valid inputs
  // ---------------------------------------------------------------------------
  describe('Valid emails accepted', () => {
    test('should accept a standard email address', () => {
      const email = new Email('user@example.com');
      expect(email.value).toBe('user@example.com');
    });

    test('should accept email with subdomain', () => {
      const email = new Email('user@mail.example.com');
      expect(email.value).toBe('user@mail.example.com');
    });

    test('should accept email with plus addressing', () => {
      const email = new Email('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });

    test('should accept email with dots in local part', () => {
      const email = new Email('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });

    test('should accept email with numeric local part', () => {
      const email = new Email('12345@example.com');
      expect(email.value).toBe('12345@example.com');
    });

    test('should accept short TLD like .io', () => {
      const email = new Email('user@example.io');
      expect(email.value).toBe('user@example.io');
    });

    test('should accept long TLD like .museum', () => {
      const email = new Email('user@example.museum');
      expect(email.value).toBe('user@example.museum');
    });
  });

  // ---------------------------------------------------------------------------
  // Construction - invalid inputs
  // ---------------------------------------------------------------------------
  describe('Invalid emails rejected', () => {
    test('should throw when email has no @ symbol', () => {
      expect(() => new Email('userexample.com')).toThrow('Invalid email format');
    });

    test('should throw when email has no domain after @', () => {
      expect(() => new Email('user@')).toThrow('Invalid email format');
    });

    test('should throw when email has no TLD (no dot after domain)', () => {
      expect(() => new Email('user@example')).toThrow('Invalid email format');
    });

    test('should throw when local part is empty', () => {
      expect(() => new Email('@example.com')).toThrow('Invalid email format');
    });

    test('should throw for empty string', () => {
      expect(() => new Email('')).toThrow('Email is required');
    });

    test('should throw for null', () => {
      expect(() => new Email(null)).toThrow('Email is required');
    });

    test('should throw for undefined', () => {
      expect(() => new Email(undefined)).toThrow('Email is required');
    });

    test('should throw when email contains spaces', () => {
      expect(() => new Email('user @example.com')).toThrow('Invalid email format');
    });

    test('should throw for email with multiple @ symbols', () => {
      expect(() => new Email('user@@example.com')).toThrow('Invalid email format');
    });
  });

  // ---------------------------------------------------------------------------
  // Normalisation
  // ---------------------------------------------------------------------------
  describe('Email normalised to lowercase', () => {
    test('should lowercase an all-uppercase email', () => {
      const email = new Email('USER@EXAMPLE.COM');
      expect(email.value).toBe('user@example.com');
    });

    test('should lowercase mixed-case local part', () => {
      const email = new Email('FiRsT.LaSt@Example.Com');
      expect(email.value).toBe('first.last@example.com');
    });

    test('should trim leading and trailing whitespace', () => {
      const email = new Email('  user@example.com  ');
      expect(email.value).toBe('user@example.com');
    });

    test('should lowercase and trim at the same time', () => {
      const email = new Email('  ADMIN@DOMAIN.KZ  ');
      expect(email.value).toBe('admin@domain.kz');
    });
  });

  // ---------------------------------------------------------------------------
  // Equality
  // ---------------------------------------------------------------------------
  describe('equals()', () => {
    test('should consider two emails with same value equal', () => {
      const a = new Email('user@example.com');
      const b = new Email('user@example.com');
      expect(a.equals(b)).toBe(true);
    });

    test('should treat case-insensitive variants as equal after normalisation', () => {
      const a = new Email('USER@EXAMPLE.COM');
      const b = new Email('user@example.com');
      expect(a.equals(b)).toBe(true);
    });

    test('should consider two different emails not equal', () => {
      const a = new Email('alice@example.com');
      const b = new Email('bob@example.com');
      expect(a.equals(b)).toBe(false);
    });

    test('should return false when compared to non-Email value', () => {
      const email = new Email('user@example.com');
      expect(email.equals('user@example.com')).toBe(false);
      expect(email.equals(null)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toString
  // ---------------------------------------------------------------------------
  describe('toString()', () => {
    test('should return the normalised value', () => {
      const email = new Email('Admin@Example.com');
      expect(email.toString()).toBe('admin@example.com');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------
  describe('Value object is immutable', () => {
    test('should be frozen (Object.freeze applied)', () => {
      const email = new Email('user@example.com');
      expect(Object.isFrozen(email)).toBe(true);
    });

    test('should not allow overwriting the _value property', () => {
      const email = new Email('user@example.com');
      // In strict mode / frozen objects this silently fails or throws depending on engine.
      // Either way the value must not have changed.
      try {
        email._value = 'hacked@evil.com';
      } catch (_) {
        // expected in strict mode
      }
      expect(email.value).toBe('user@example.com');
    });

    test('should not allow adding new properties', () => {
      const email = new Email('user@example.com');
      try {
        email.newProp = 'test';
      } catch (_) {
        // expected in strict mode
      }
      expect(email.newProp).toBeUndefined();
    });
  });
});
