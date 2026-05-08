/**
 * Dimensions Value Object
 * Represents window dimensions (width and height) in millimeters
 */
export class Dimensions {
  constructor({ width, height, widthLeft, widthCenter, widthRight, heightLeft, heightCenter, heightRight }) {
    // Validation helper
    const validateDimension = (value, name) => {
      if (value !== undefined && value !== null && value !== 0) {
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
          throw new Error(`${name} must be a valid number`);
        }
        if (value < 0) {
          throw new Error(`${name} cannot be negative`);
        }
        if (value > 10000) {
          throw new Error(`${name} is too large (max 10000mm)`);
        }
      }
    };

    // Support both simple (width/height) and detailed (left/center/right) formats
    const w = widthCenter || width || 0;
    const h = heightCenter || height || 0;

    // Validate all provided dimensions
    validateDimension(width, 'Width');
    validateDimension(height, 'Height');
    validateDimension(widthLeft, 'Width left');
    validateDimension(widthCenter, 'Width center');
    validateDimension(widthRight, 'Width right');
    validateDimension(heightLeft, 'Height left');
    validateDimension(heightCenter, 'Height center');
    validateDimension(heightRight, 'Height right');

    // Allow zero dimensions for new measurements
    this._widthLeft = widthLeft || w;
    this._widthCenter = w;
    this._widthRight = widthRight || w;
    this._heightLeft = heightLeft || h;
    this._heightCenter = h;
    this._heightRight = heightRight || h;

    Object.freeze(this);
  }

  get widthLeft() {
    return this._widthLeft;
  }

  get widthCenter() {
    return this._widthCenter;
  }

  get widthRight() {
    return this._widthRight;
  }

  get heightLeft() {
    return this._heightLeft;
  }

  get heightCenter() {
    return this._heightCenter;
  }

  get heightRight() {
    return this._heightRight;
  }

  // Get minimum width (safest for fabric calculation)
  get minWidth() {
    return Math.min(this._widthLeft, this._widthCenter, this._widthRight);
  }

  // Get maximum width
  get maxWidth() {
    return Math.max(this._widthLeft, this._widthCenter, this._widthRight);
  }

  // Get minimum height
  get minHeight() {
    return Math.min(this._heightLeft, this._heightCenter, this._heightRight);
  }

  // Get maximum height
  get maxHeight() {
    return Math.max(this._heightLeft, this._heightCenter, this._heightRight);
  }

  // Calculate average width
  get averageWidth() {
    return Math.round((this._widthLeft + this._widthCenter + this._widthRight) / 3);
  }

  // Calculate average height
  get averageHeight() {
    return Math.round((this._heightLeft + this._heightCenter + this._heightRight) / 3);
  }

  // Check if window has uneven dimensions
  hasUnevenDimensions() {
    const widthVariance = this.maxWidth - this.minWidth;
    const heightVariance = this.maxHeight - this.minHeight;

    // If variance is more than 50mm, it's considered uneven
    return widthVariance > 50 || heightVariance > 50;
  }

  // Get total area in square meters
  getArea() {
    const widthInMeters = this.averageWidth / 1000;
    const heightInMeters = this.averageHeight / 1000;
    return widthInMeters * heightInMeters;
  }

  equals(other) {
    return (
      other instanceof Dimensions &&
      this._widthLeft === other._widthLeft &&
      this._widthCenter === other._widthCenter &&
      this._widthRight === other._widthRight &&
      this._heightLeft === other._heightLeft &&
      this._heightCenter === other._heightCenter &&
      this._heightRight === other._heightRight
    );
  }

  toJSON() {
    return {
      widthLeft: this._widthLeft,
      widthCenter: this._widthCenter,
      widthRight: this._widthRight,
      heightLeft: this._heightLeft,
      heightCenter: this._heightCenter,
      heightRight: this._heightRight,
    };
  }

  static fromJSON(json) {
    return new Dimensions(json);
  }

  toString() {
    return `W: ${this.minWidth}-${this.maxWidth}mm, H: ${this.minHeight}-${this.maxHeight}mm`;
  }
}
