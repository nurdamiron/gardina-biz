import { v4 as uuidv4 } from 'uuid';

/**
 * Base Entity Class
 * All domain entities inherit from this base class
 */
export class BaseEntity {
  constructor(id) {
    this._id = id || uuidv4();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id() {
    return this._id;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  _markAsUpdated() {
    this._updatedAt = new Date();
  }

  equals(other) {
    if (!(other instanceof BaseEntity)) {
      return false;
    }
    return this._id === other._id;
  }

  toJSON() {
    return {
      id: this._id,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
