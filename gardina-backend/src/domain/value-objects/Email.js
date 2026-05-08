/**
 * Email Value Object
 * Immutable value object representing an email address
 */
export class Email {
  constructor(value) {
    if (!value) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    this._value = value.toLowerCase().trim();
    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof Email && this._value === other._value;
  }

  toString() {
    return this._value;
  }
}
