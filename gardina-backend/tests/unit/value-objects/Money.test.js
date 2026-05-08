import { Money } from '../../../src/domain/value-objects/Money.js';

describe('Money Value Object', () => {
  describe('Constructor', () => {
    test('should create Money with valid amount', () => {
      const money = new Money(100);
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('KZT');
    });

    test('should create Money with custom currency', () => {
      const money = new Money(100, 'USD');
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    test('should round to 2 decimal places', () => {
      const money = new Money(100.12345);
      expect(money.amount).toBe(100.12);
    });

    test('should throw error for negative amount', () => {
      expect(() => new Money(-100)).toThrow('Amount cannot be negative');
    });

    test('should throw error for invalid amount', () => {
      expect(() => new Money('invalid')).toThrow('Amount must be a valid number');
      expect(() => new Money(NaN)).toThrow('Amount must be a valid number');
    });

    test('should accept zero amount', () => {
      const money = new Money(0);
      expect(money.amount).toBe(0);
    });

    test('should be immutable', () => {
      const money = new Money(100);
      expect(Object.isFrozen(money)).toBe(true);
    });
  });

  describe('add()', () => {
    test('should add two Money objects with same currency', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);
      const result = money1.add(money2);

      expect(result.amount).toBe(150);
      expect(result.currency).toBe('KZT');
    });

    test('should throw error when adding different currencies', () => {
      const money1 = new Money(100, 'KZT');
      const money2 = new Money(50, 'USD');

      expect(() => money1.add(money2)).toThrow('Cannot add different currencies');
    });

    test('should throw error when adding non-Money object', () => {
      const money = new Money(100);

      expect(() => money.add(50)).toThrow('Can only add Money to Money');
    });
  });

  describe('subtract()', () => {
    test('should subtract two Money objects with same currency', () => {
      const money1 = new Money(100);
      const money2 = new Money(30);
      const result = money1.subtract(money2);

      expect(result.amount).toBe(70);
    });

    test('should throw error when result is negative', () => {
      const money1 = new Money(50);
      const money2 = new Money(100);

      // This is a bug fix from the report - should prevent negative amounts
      expect(() => money1.subtract(money2)).toThrow('Amount cannot be negative');
    });

    test('should throw error when subtracting different currencies', () => {
      const money1 = new Money(100, 'KZT');
      const money2 = new Money(50, 'USD');

      expect(() => money1.subtract(money2)).toThrow('Cannot subtract different currencies');
    });

    test('should throw error when subtracting non-Money object', () => {
      const money = new Money(100);

      expect(() => money.subtract(50)).toThrow('Can only subtract Money from Money');
    });
  });

  describe('multiply()', () => {
    test('should multiply Money by a factor', () => {
      const money = new Money(100);
      const result = money.multiply(2.5);

      expect(result.amount).toBe(250);
    });

    test('should throw error for invalid factor', () => {
      const money = new Money(100);

      expect(() => money.multiply('invalid')).toThrow('Factor must be a valid number');
      expect(() => money.multiply(NaN)).toThrow('Factor must be a valid number');
    });

    test('should handle zero multiplication', () => {
      const money = new Money(100);
      const result = money.multiply(0);

      expect(result.amount).toBe(0);
    });

    test('should handle negative multiplication', () => {
      const money = new Money(100);

      // Should throw because result would be negative
      expect(() => money.multiply(-1)).toThrow('Amount cannot be negative');
    });
  });

  describe('percentage()', () => {
    test('should calculate percentage correctly', () => {
      const money = new Money(1000);
      const result = money.percentage(10);

      expect(result.amount).toBe(100);
    });

    test('should calculate 50 percent', () => {
      const money = new Money(200);
      const result = money.percentage(50);

      expect(result.amount).toBe(100);
    });

    test('should throw error for invalid percentage', () => {
      const money = new Money(100);

      expect(() => money.percentage('invalid')).toThrow('Percent must be a valid number');
      expect(() => money.percentage(NaN)).toThrow('Percent must be a valid number');
    });

    test('should handle zero percentage', () => {
      const money = new Money(100);
      const result = money.percentage(0);

      expect(result.amount).toBe(0);
    });
  });

  describe('equals()', () => {
    test('should return true for equal Money objects', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);

      expect(money1.equals(money2)).toBe(true);
    });

    test('should return false for different amounts', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);

      expect(money1.equals(money2)).toBe(false);
    });

    test('should return false for different currencies', () => {
      const money1 = new Money(100, 'KZT');
      const money2 = new Money(100, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });

    test('should return false for non-Money object', () => {
      const money = new Money(100);

      expect(money.equals(100)).toBe(false);
      expect(money.equals(null)).toBe(false);
    });
  });

  describe('isGreaterThan()', () => {
    test('should return true when amount is greater', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);

      expect(money1.isGreaterThan(money2)).toBe(true);
    });

    test('should return false when amount is smaller', () => {
      const money1 = new Money(50);
      const money2 = new Money(100);

      expect(money1.isGreaterThan(money2)).toBe(false);
    });

    test('should return false when amounts are equal', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);

      expect(money1.isGreaterThan(money2)).toBe(false);
    });

    test('should throw error when comparing different currencies', () => {
      const money1 = new Money(100, 'KZT');
      const money2 = new Money(50, 'USD');

      expect(() => money1.isGreaterThan(money2)).toThrow('Cannot compare different currencies');
    });
  });

  describe('isLessThan()', () => {
    test('should return true when amount is smaller', () => {
      const money1 = new Money(50);
      const money2 = new Money(100);

      expect(money1.isLessThan(money2)).toBe(true);
    });

    test('should return false when amount is greater', () => {
      const money1 = new Money(100);
      const money2 = new Money(50);

      expect(money1.isLessThan(money2)).toBe(false);
    });

    test('should return false when amounts are equal', () => {
      const money1 = new Money(100);
      const money2 = new Money(100);

      expect(money1.isLessThan(money2)).toBe(false);
    });
  });

  describe('toJSON()', () => {
    test('should serialize to JSON correctly', () => {
      const money = new Money(100.50, 'KZT');
      const json = money.toJSON();

      expect(json).toEqual({
        amount: 100.50,
        currency: 'KZT',
      });
    });
  });

  describe('fromJSON()', () => {
    test('should deserialize from JSON correctly', () => {
      const json = { amount: 100, currency: 'KZT' };
      const money = Money.fromJSON(json);

      expect(money.amount).toBe(100);
      expect(money.currency).toBe('KZT');
    });
  });

  describe('toString()', () => {
    test('should format as string with locale', () => {
      const money = new Money(1000);
      const str = money.toString();

      expect(str).toContain('KZT');
      expect(str).toContain('1');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large numbers', () => {
      const money = new Money(999999999.99);
      expect(money.amount).toBe(999999999.99);
    });

    test('should handle very small amounts', () => {
      const money = new Money(0.01);
      expect(money.amount).toBe(0.01);
    });

    test('should handle floating point precision', () => {
      const money1 = new Money(0.1);
      const money2 = new Money(0.2);
      const result = money1.add(money2);

      // Should be 0.3, not 0.30000000000000004
      expect(result.amount).toBe(0.30);
    });

    test('should round properly on construction', () => {
      const money = new Money(10.12345678);
      expect(money.amount).toBe(10.12);
    });

    test('should handle zero amount operations', () => {
      const money1 = new Money(100);
      const money2 = new Money(0);

      const added = money1.add(money2);
      expect(added.amount).toBe(100);

      const subtracted = money1.subtract(money2);
      expect(subtracted.amount).toBe(100);
    });

    test('should handle percentage edge cases', () => {
      const money = new Money(100);

      // 100% should equal original
      const hundred = money.percentage(100);
      expect(hundred.amount).toBe(100);

      // 0% should be zero
      const zero = money.percentage(0);
      expect(zero.amount).toBe(0);

      // Over 100%
      const overHundred = money.percentage(150);
      expect(overHundred.amount).toBe(150);
    });

    test('should handle chained operations', () => {
      const money = new Money(1000);
      const result = money
        .multiply(2)
        .add(new Money(500))
        .subtract(new Money(200));

      expect(result.amount).toBe(2300);
    });

    test('should prevent precision loss in division-like operations', () => {
      const money = new Money(100);
      const third = money.percentage(33.33);

      expect(third.amount).toBe(33.33);
    });

    test('should handle exact equality comparisons', () => {
      const money1 = new Money(100.50);
      const money2 = new Money(100.50);

      expect(money1.equals(money2)).toBe(true);
    });

    test('should handle boundary values in comparisons', () => {
      const money1 = new Money(100.00);
      const money2 = new Money(100.01);

      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(true);
    });
  });
});
