import { Phone } from '../../../src/domain/value-objects/Phone.js';

describe('Phone Value Object', () => {
  // ---------------------------------------------------------------------------
  // Construction - valid Kazakhstan phone formats
  // ---------------------------------------------------------------------------
  describe('Valid KZ phone formats accepted', () => {
    test('should accept +7 followed by 10 digits (canonical form)', () => {
      const phone = new Phone('+77011234567');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept 8 followed by 10 digits (domestic format)', () => {
      const phone = new Phone('87011234567');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept +7 format with spaces', () => {
      const phone = new Phone('+7 701 123 45 67');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept +7 format with dashes', () => {
      const phone = new Phone('+7-701-123-45-67');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept +7 format with parentheses around area code', () => {
      const phone = new Phone('+7(701)1234567');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept 8 format with spaces', () => {
      const phone = new Phone('8 701 123 45 67');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept mixed separators: spaces and dashes', () => {
      const phone = new Phone('+7 701 123-45-67');
      expect(phone.value).toBe('+77011234567');
    });

    test('should accept KZ mobile operator 700 series', () => {
      const phone = new Phone('+77001234567');
      expect(phone.value).toBe('+77001234567');
    });

    test('should accept KZ mobile operator 702 series', () => {
      const phone = new Phone('+77021234567');
      expect(phone.value).toBe('+77021234567');
    });

    test('should accept KZ mobile operator 747 series', () => {
      const phone = new Phone('+77471234567');
      expect(phone.value).toBe('+77471234567');
    });
  });

  // ---------------------------------------------------------------------------
  // Construction - invalid inputs
  // ---------------------------------------------------------------------------
  describe('Invalid phones rejected', () => {
    test('should throw for empty string', () => {
      expect(() => new Phone('')).toThrow('Phone number is required');
    });

    test('should throw for null', () => {
      expect(() => new Phone(null)).toThrow('Phone number is required');
    });

    test('should throw for undefined', () => {
      expect(() => new Phone(undefined)).toThrow('Phone number is required');
    });

    test('should throw for number that is too short (9 digits after country code)', () => {
      expect(() => new Phone('+7701123456')).toThrow('Invalid phone format');
    });

    test('should throw for number that is too long (11 digits after country code)', () => {
      expect(() => new Phone('+770112345678')).toThrow('Invalid phone format');
    });

    test('should throw for number containing letters', () => {
      expect(() => new Phone('+7701ABCDEFG')).toThrow('Invalid phone format');
    });

    test('should throw for number with wrong country code (+1)', () => {
      expect(() => new Phone('+12125551234')).toThrow('Invalid phone format');
    });

    test('should throw for number with wrong country code (+44)', () => {
      expect(() => new Phone('+442071234567')).toThrow('Invalid phone format');
    });

    test('should throw for plain 10 digits with no country prefix', () => {
      expect(() => new Phone('7011234567')).toThrow('Invalid phone format');
    });

    test('should throw for number with only spaces', () => {
      expect(() => new Phone('     ')).toThrow('Phone number is required');
    });
  });

  // ---------------------------------------------------------------------------
  // Normalisation — canonical storage format
  // ---------------------------------------------------------------------------
  describe('Phone normalised to canonical +7XXXXXXXXXX form', () => {
    test('8-prefix is converted to +7 prefix', () => {
      const phone = new Phone('87011234567');
      expect(phone.value).toBe('+77011234567');
      expect(phone.value.startsWith('+7')).toBe(true);
    });

    test('spaces are stripped before storing', () => {
      const phone = new Phone('+7 701 123 45 67');
      expect(phone.value).toBe('+77011234567');
      expect(phone.value).not.toContain(' ');
    });

    test('dashes are stripped before storing', () => {
      const phone = new Phone('+7-701-123-45-67');
      expect(phone.value).toBe('+77011234567');
      expect(phone.value).not.toContain('-');
    });

    test('parentheses are stripped before storing', () => {
      const phone = new Phone('+7(701)1234567');
      expect(phone.value).toBe('+77011234567');
      expect(phone.value).not.toContain('(');
    });

    test('stored value always has exactly 12 characters (+7 + 10 digits)', () => {
      const phone = new Phone('+77011234567');
      expect(phone.value.length).toBe(12);
    });
  });

  // ---------------------------------------------------------------------------
  // Formatted getter
  // ---------------------------------------------------------------------------
  describe('formatted getter', () => {
    test('should return human-readable format +7 (XXX) XXX-XX-XX', () => {
      const phone = new Phone('+77011234567');
      expect(phone.formatted).toBe('+7 (701) 123-45-67');
    });

    test('formatted phone from 8-prefixed input', () => {
      const phone = new Phone('87001234567');
      expect(phone.formatted).toBe('+7 (700) 123-45-67');
    });
  });

  // ---------------------------------------------------------------------------
  // Equality
  // ---------------------------------------------------------------------------
  describe('equals()', () => {
    test('should consider two phones with same canonical value equal', () => {
      const a = new Phone('+77011234567');
      const b = new Phone('+77011234567');
      expect(a.equals(b)).toBe(true);
    });

    test('should consider 8-prefix and +7-prefix versions of same number equal', () => {
      const a = new Phone('87011234567');
      const b = new Phone('+77011234567');
      expect(a.equals(b)).toBe(true);
    });

    test('should return false for different numbers', () => {
      const a = new Phone('+77011234567');
      const b = new Phone('+77779999999');
      expect(a.equals(b)).toBe(false);
    });

    test('should return false when compared to a non-Phone value', () => {
      const phone = new Phone('+77011234567');
      expect(phone.equals('+77011234567')).toBe(false);
      expect(phone.equals(null)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // toString
  // ---------------------------------------------------------------------------
  describe('toString()', () => {
    test('should return the canonical +7 value', () => {
      const phone = new Phone('87011234567');
      expect(phone.toString()).toBe('+77011234567');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability
  // ---------------------------------------------------------------------------
  describe('Value object is immutable', () => {
    test('should be frozen (Object.freeze applied)', () => {
      const phone = new Phone('+77011234567');
      expect(Object.isFrozen(phone)).toBe(true);
    });

    test('should not allow overwriting the _value property', () => {
      const phone = new Phone('+77011234567');
      try {
        phone._value = '+70000000000';
      } catch (_) {
        // expected in strict mode
      }
      expect(phone.value).toBe('+77011234567');
    });

    test('should not allow adding new properties', () => {
      const phone = new Phone('+77011234567');
      try {
        phone.extra = 'injected';
      } catch (_) {
        // expected in strict mode
      }
      expect(phone.extra).toBeUndefined();
    });
  });
});
