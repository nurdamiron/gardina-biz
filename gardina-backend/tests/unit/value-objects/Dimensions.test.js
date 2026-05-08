import { Dimensions } from '../../../src/domain/value-objects/Dimensions.js';

describe('Dimensions Value Object', () => {
  describe('Constructor', () => {
    test('should create with all dimensions', () => {
      const dims = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990,
        heightLeft: 1480,
        heightCenter: 1500,
        heightRight: 1490,
      });

      expect(dims.widthCenter).toBe(2000);
      expect(dims.heightCenter).toBe(1500);
    });

    test('should create with only center dimensions', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      expect(dims.widthLeft).toBe(2000); // Uses center as default
      expect(dims.widthRight).toBe(2000);
      expect(dims.heightLeft).toBe(1500);
      expect(dims.heightRight).toBe(1500);
    });

    test('should allow creation without widthCenter (defaults to 0)', () => {
      const dims = new Dimensions({
        heightCenter: 1500,
      });
      expect(dims.widthCenter).toBe(0);
      expect(dims.heightCenter).toBe(1500);
    });

    test('should allow creation without heightCenter (defaults to 0)', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
      });
      expect(dims.widthCenter).toBe(2000);
      expect(dims.heightCenter).toBe(0);
    });

    test('should allow zero dimensions for new measurements', () => {
      const dims = new Dimensions({
        widthCenter: 0,
        heightCenter: 1500,
      });
      expect(dims.widthCenter).toBe(0);
      expect(dims.heightCenter).toBe(1500);
    });

    test('should reject negative dimensions', () => {
      expect(() => new Dimensions({
        widthCenter: -2000,
        heightCenter: 1500,
      })).toThrow('Width center cannot be negative');
    });

    test('should reject non-number dimensions', () => {
      expect(() => new Dimensions({
        widthCenter: '2000',
        heightCenter: 1500,
      })).toThrow('Width center must be a valid number');
    });

    test('should reject too large dimensions', () => {
      expect(() => new Dimensions({
        widthCenter: 15000,
        heightCenter: 2500,
      })).toThrow('Width center is too large');
    });

    test('should reject NaN dimensions', () => {
      expect(() => new Dimensions({
        widthCenter: NaN,
        heightCenter: 2500,
      })).toThrow('Width center must be a valid number');
    });

    test('should reject Infinity dimensions', () => {
      expect(() => new Dimensions({
        widthCenter: Infinity,
        heightCenter: 2500,
      })).toThrow('Width center must be a valid number');
    });

    test('should be immutable', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      expect(Object.isFrozen(dims)).toBe(true);
    });
  });

  describe('minWidth / maxWidth', () => {
    test('should calculate min and max width', () => {
      const dims = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990,
        heightCenter: 1500,
      });

      expect(dims.minWidth).toBe(1980);
      expect(dims.maxWidth).toBe(2000);
    });

    test('should return same value if all widths equal', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      expect(dims.minWidth).toBe(2000);
      expect(dims.maxWidth).toBe(2000);
    });
  });

  describe('minHeight / maxHeight', () => {
    test('should calculate min and max height', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightLeft: 1480,
        heightCenter: 1500,
        heightRight: 1490,
      });

      expect(dims.minHeight).toBe(1480);
      expect(dims.maxHeight).toBe(1500);
    });
  });

  describe('averageWidth / averageHeight', () => {
    test('should calculate average width', () => {
      const dims = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990,
        heightCenter: 1500,
      });

      expect(dims.averageWidth).toBe(1990); // (1980+2000+1990)/3 = 1990
    });

    test('should round average to integer', () => {
      const dims = new Dimensions({
        widthLeft: 1981,
        widthCenter: 2000,
        widthRight: 1990,
        heightCenter: 1500,
      });

      expect(Number.isInteger(dims.averageWidth)).toBe(true);
    });
  });

  describe('hasUnevenDimensions()', () => {
    test('should return true for uneven dimensions (>50mm variance)', () => {
      const dims = new Dimensions({
        widthLeft: 1900,
        widthCenter: 2000,
        widthRight: 1990,
        heightCenter: 1500,
      });

      expect(dims.hasUnevenDimensions()).toBe(true); // 100mm variance
    });

    test('should return false for even dimensions', () => {
      const dims = new Dimensions({
        widthLeft: 1990,
        widthCenter: 2000,
        widthRight: 2010,
        heightCenter: 1500,
      });

      expect(dims.hasUnevenDimensions()).toBe(false); // 20mm variance
    });

    test('should check both width and height variance', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightLeft: 1400,
        heightCenter: 1500,
        heightRight: 1490,
      });

      expect(dims.hasUnevenDimensions()).toBe(true); // 100mm height variance
    });
  });

  describe('getArea()', () => {
    test('should calculate area in square meters', () => {
      const dims = new Dimensions({
        widthCenter: 2000, // 2 meters
        heightCenter: 1500, // 1.5 meters
      });

      expect(dims.getArea()).toBe(3.0); // 2 * 1.5 = 3.0 m²
    });

    test('should use average dimensions', () => {
      const dims = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990, // avg = 1990mm
        heightCenter: 1500, // avg = 1500mm
      });

      const area = dims.getArea();
      expect(area).toBeCloseTo(2.985, 2); // 1.99 * 1.5
    });
  });

  describe('equals()', () => {
    test('should return true for equal dimensions', () => {
      const dims1 = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      const dims2 = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      expect(dims1.equals(dims2)).toBe(true);
    });

    test('should return false for different dimensions', () => {
      const dims1 = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      const dims2 = new Dimensions({
        widthCenter: 2100,
        heightCenter: 1500,
      });

      expect(dims1.equals(dims2)).toBe(false);
    });

    test('should compare all six measurements', () => {
      const dims1 = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990,
        heightLeft: 1480,
        heightCenter: 1500,
        heightRight: 1490,
      });

      const dims2 = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1991, // Different!
        heightLeft: 1480,
        heightCenter: 1500,
        heightRight: 1490,
      });

      expect(dims1.equals(dims2)).toBe(false);
    });
  });

  describe('toJSON()', () => {
    test('should serialize to JSON', () => {
      const dims = new Dimensions({
        widthCenter: 2000,
        heightCenter: 1500,
      });

      const json = dims.toJSON();

      expect(json.widthCenter).toBe(2000);
      expect(json.heightCenter).toBe(1500);
    });
  });

  describe('fromJSON()', () => {
    test('should deserialize from JSON', () => {
      const json = {
        widthCenter: 2000,
        heightCenter: 1500,
      };

      const dims = Dimensions.fromJSON(json);

      expect(dims.widthCenter).toBe(2000);
      expect(dims.heightCenter).toBe(1500);
    });
  });

  describe('toString()', () => {
    test('should format as readable string', () => {
      const dims = new Dimensions({
        widthLeft: 1980,
        widthCenter: 2000,
        widthRight: 1990,
        heightCenter: 1500,
      });

      const str = dims.toString();

      expect(str).toContain('W:');
      expect(str).toContain('H:');
      expect(str).toContain('1980');
      expect(str).toContain('2000');
    });
  });
});
