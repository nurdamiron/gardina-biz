import { BaseEntity } from '../entities/BaseEntity.js';
import { Dimensions } from '../value-objects/Dimensions.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Measurement Aggregate
 * Represents a measurement session at client's location
 */
export class Measurement extends BaseEntity {
  static STATUS = {
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  constructor({
    id,
    clientId,
    designerId = null,
    status = Measurement.STATUS.SCHEDULED,
    scheduledAt,
    startedAt = null,
    completedAt = null,
    address,
    roomType = null,
    budgetMin = null,
    budgetMax = null,
    deadline = null,
    clientReaction = null,
    notes = null,
    mapLink = null,
    priority = 'standard',
    styles = null,
    curtainTypes = null,
    technicalFeatures = [],
    windows = [],
    photos = [],
    createdAt,
    updatedAt,
  }) {
    super(id);

    if (!clientId) throw new Error('Client ID is required');
    if (!address) throw new Error('Address is required');

    this._clientId = clientId;
    this._designerId = designerId; // Nullable - allows keeping measurements if designer is deleted
    this._status = status;
    this._scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    this._startedAt = startedAt ? new Date(startedAt) : null;
    this._completedAt = completedAt ? new Date(completedAt) : null;
    this._address = address;
    this._roomType = roomType;
    this._budgetMin = budgetMin;
    this._budgetMax = budgetMax;
    this._deadline = deadline ? new Date(deadline) : null;
    this._clientReaction = clientReaction;
    this._notes = notes;
    this._mapLink = mapLink;
    this._priority = priority;
    this._styles = styles;
    this._curtainTypes = curtainTypes;
    this._technicalFeatures = Array.isArray(technicalFeatures) ? technicalFeatures : [];
    this._windows = windows;
    this._photos = photos;

    if (createdAt) this._createdAt = new Date(createdAt);
    if (updatedAt) this._updatedAt = new Date(updatedAt);
    
    this._deliveryCost = 0; // Initialize default
  }

  // Getters
  get clientId() { return this._clientId; }
  get designerId() { return this._designerId; }
  get status() { return this._status; }
  get scheduledAt() { return this._scheduledAt; }
  get startedAt() { return this._startedAt; }
  get completedAt() { return this._completedAt; }
  get address() { return this._address; }
  get roomType() { return this._roomType; }
  get budgetMin() { return this._budgetMin; }
  get budgetMax() { return this._budgetMax; }
  get deadline() { return this._deadline; }
  get clientReaction() { return this._clientReaction; }
  get notes() { return this._notes; }
  get mapLink() { return this._mapLink; }
  get priority() { return this._priority; }
  get styles() { return this._styles; }
  get curtainTypes() { return this._curtainTypes; }
  get technicalFeatures() { return [...this._technicalFeatures]; }
  get windows() { return [...this._windows]; }
  get photos() { return [...this._photos]; }
  get deliveryCost() { return this._deliveryCost; }

  // Business methods

  updateMetadata({ roomType, deadline, notes, mapLink, priority, styles, curtainTypes, technicalFeatures } = {}) {
    if (roomType !== undefined) this._roomType = roomType;
    if (deadline !== undefined) this._deadline = deadline ? new Date(deadline) : null;
    if (notes !== undefined) this._notes = notes;
    if (mapLink !== undefined) this._mapLink = mapLink;
    if (priority !== undefined) this._priority = priority;
    if (styles !== undefined) this._styles = styles;
    if (curtainTypes !== undefined) this._curtainTypes = curtainTypes;
    if (technicalFeatures !== undefined) this._technicalFeatures = Array.isArray(technicalFeatures) ? technicalFeatures : [];
    this._markAsUpdated();
  }

  setDeliveryCost(cost) {
    this._deliveryCost = cost;
    this._markAsUpdated();
  }

  start() {
    if (this._status !== Measurement.STATUS.SCHEDULED) {
      throw new Error('Can only start scheduled measurements');
    }
    this._status = Measurement.STATUS.IN_PROGRESS;
    this._startedAt = new Date();
    this._markAsUpdated();
  }

  addWindow(windowData) {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Cannot add window to completed measurement');
    }

    this._windows.push({
      id: windowData.id || uuidv4(), // Generate UUID if not provided
      windowNumber: this._windows.length + 1,
      roomName: windowData.roomName,
      dimensions: new Dimensions(windowData.dimensions),
      mountingType: windowData.mountingType,
      topOffset: windowData.topOffset,
      sillHeight: windowData.sillHeight,
      obstacles: windowData.obstacles || [],
      notes: windowData.notes,
      // New structure: items array handles fabrics, cornices, accessories
      items: windowData.items || [], 
      // Keep legacy fields for backward compatibility if needed, or deprecate
      fabricCode: windowData.fabricCode, 
      fabricBrand: windowData.fabricBrand,
      
      priceBreakdown: windowData.priceBreakdown || {},
      designPhotos: windowData.designPhotos || [],
    });

    // Check if delivery cost is provided in window data
    if (windowData.deliveryCost !== undefined) {
       this._deliveryCost = windowData.deliveryCost;
    }

    this._markAsUpdated();
  }

  removeWindow(windowId) {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Cannot remove window from completed measurement');
    }

    const initialLength = this._windows.length;
    this._windows = this._windows.filter(w => w.id !== windowId);

    if (this._windows.length === initialLength) {
      throw new Error('Window not found');
    }

    // Renumber remaining windows
    this._windows.forEach((w, index) => {
      w.windowNumber = index + 1;
    });

    this._markAsUpdated();
  }

  updateWindow(windowId, windowData) {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Cannot update window in completed measurement');
    }

    const windowIndex = this._windows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) {
      throw new Error('Window not found');
    }

    // Update window with new data
    this._windows[windowIndex] = {
      ...this._windows[windowIndex],
      roomName: windowData.roomName || this._windows[windowIndex].roomName,
      dimensions: windowData.dimensions ? new Dimensions(windowData.dimensions) : this._windows[windowIndex].dimensions,
      mountingType: windowData.mountingType || this._windows[windowIndex].mountingType,
      topOffset: windowData.topOffset ?? this._windows[windowIndex].topOffset,
      sillHeight: windowData.sillHeight ?? this._windows[windowIndex].sillHeight,
      obstacles: windowData.obstacles ?? this._windows[windowIndex].obstacles,
      notes: windowData.notes ?? this._windows[windowIndex].notes,
      
      // Update items if provided
      items: windowData.items ?? this._windows[windowIndex].items,
      
      fabricCode: windowData.fabricCode ?? this._windows[windowIndex].fabricCode,
      fabricBrand: windowData.fabricBrand ?? this._windows[windowIndex].fabricBrand,
      priceBreakdown: windowData.priceBreakdown ?? this._windows[windowIndex].priceBreakdown,
      designPhotos: windowData.designPhotos ?? this._windows[windowIndex].designPhotos,
    };

    this._markAsUpdated();
  }

  getWindow(windowId) {
    return this._windows.find(w => w.id === windowId);
  }

  addPhoto(photoData) {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Cannot add photo to completed measurement');
    }

    this._photos.push({
      id: photoData.id || uuidv4(), // Generate UUID if not provided
      type: photoData.type,
      url: photoData.url,
      thumbnailUrl: photoData.thumbnailUrl,
      description: photoData.description,
    });

    this._markAsUpdated();
  }

  updateBudget(min, max) {
    this._budgetMin = min;
    this._budgetMax = max;
    this._markAsUpdated();
  }

  setClientReaction(reaction) {
    this._clientReaction = reaction;
    this._markAsUpdated();
  }

  addNotes(notes) {
    this._notes = notes;
    this._markAsUpdated();
  }

  complete() {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Measurement already completed');
    }

    if (this._windows.length === 0) {
      throw new Error('Cannot complete measurement without windows');
    }

    this._status = Measurement.STATUS.COMPLETED;
    this._completedAt = new Date();
    this._markAsUpdated();
  }

  cancel() {
    if (this._status === Measurement.STATUS.COMPLETED) {
      throw new Error('Cannot cancel completed measurement');
    }

    this._status = Measurement.STATUS.CANCELLED;
    this._markAsUpdated();
  }

  isOverdue() {
    if (!this._deadline || this._status === Measurement.STATUS.COMPLETED) {
      return false;
    }
    return new Date() > this._deadline;
  }

  // Helper to format date as ISO string (proper UTC)
  _formatDateLocal(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      clientId: this._clientId,
      designerId: this._designerId,
      status: this._status,
      scheduledAt: this._formatDateLocal(this._scheduledAt),
      startedAt: this._formatDateLocal(this._startedAt),
      completedAt: this._formatDateLocal(this._completedAt),
      address: this._address,
      roomType: this._roomType,
      budgetMin: this._budgetMin,
      budgetMax: this._budgetMax,
      deadline: this._deadline ? this._deadline.toISOString().split('T')[0] : null,
      clientReaction: this._clientReaction,
      notes: this._notes,
      mapLink: this._mapLink,
      priority: this._priority,
      styles: this._styles,
      curtainTypes: this._curtainTypes,
      technicalFeatures: this._technicalFeatures,
      deliveryCost: this._deliveryCost,
      windows: this._windows.map(w => ({
        ...w,
        dimensions: w.dimensions?.toJSON(),
      })),
      photos: this._photos,
    };
  }

  static create({ clientId, designerId, address, scheduledAt }) {
    return new Measurement({
      clientId,
      designerId,
      address,
      scheduledAt,
      status: Measurement.STATUS.SCHEDULED,
    });
  }
}
