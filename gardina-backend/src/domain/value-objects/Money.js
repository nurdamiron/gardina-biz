/**
 * Money Value Object
 * Immutable value object representing monetary value in Tenge (KZT)
 */
export class Money {
  constructor(amount, currency = 'KZT') {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      throw new Error('Amount must be a valid number');
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (amount > 1000000000) {
      throw new Error('Amount is too large (max 1 billion)');
    }

    this._amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this._currency = currency;
    Object.freeze(this);
  }

  get amount() {
    return this._amount;
  }

  get currency() {
    return this._currency;
  }

  add(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only add Money to Money');
    }
    if (this._currency !== other._currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only subtract Money from Money');
    }
    if (this._currency !== other._currency) {
      throw new Error('Cannot subtract different currencies');
    }
    const result = this._amount - other._amount;
    if (result < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money(result, this._currency);
  }

  multiply(factor) {
    if (typeof factor !== 'number' || isNaN(factor)) {
      throw new Error('Factor must be a valid number');
    }
    const result = this._amount * factor;
    if (result < 0) {
      throw new Error('Amount cannot be negative');
    }
    return new Money(result, this._currency);
  }

  percentage(percent) {
    if (typeof percent !== 'number' || isNaN(percent)) {
      throw new Error('Percent must be a valid number');
    }
    return new Money((this._amount * percent) / 100, this._currency);
  }

  equals(other) {
    return (
      other instanceof Money &&
      this._amount === other._amount &&
      this._currency === other._currency
    );
  }

  isGreaterThan(other) {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this._amount > other._amount;
  }

  isLessThan(other) {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare different currencies');
    }
    return this._amount < other._amount;
  }

  toString() {
    return `${this._amount.toLocaleString('ru-KZ')} ${this._currency}`;
  }

  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency,
    };
  }

  static fromJSON(json) {
    return new Money(json.amount, json.currency);
  }
}
