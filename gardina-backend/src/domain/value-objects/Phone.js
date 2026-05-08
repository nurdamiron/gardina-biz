/**
 * Phone Value Object
 * Immutable value object representing a phone number
 */
export class Phone {
  constructor(value) {
    if (!value) {
      throw new Error('Phone number is required');
    }

    // Normalize phone (remove spaces, dashes, etc.)
    const normalized = value.replace(/[\s\-\(\)]/g, '');

    // Validate Kazakhstan phone format (+7XXXXXXXXXX or 8XXXXXXXXXX)
    const phoneRegex = /^(\+7|8)\d{10}$/;
    if (!phoneRegex.test(normalized)) {
      throw new Error('Invalid phone format. Expected: +7XXXXXXXXXX or 8XXXXXXXXXX');
    }

    // Always store as +7 format
    this._value = normalized.startsWith('8')
      ? '+7' + normalized.slice(1)
      : normalized;

    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  get formatted() {
    // Format as +7 (XXX) XXX-XX-XX
    const match = this._value.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
    }
    return this._value;
  }

  equals(other) {
    return other instanceof Phone && this._value === other._value;
  }

  toString() {
    return this._value;
  }
}
