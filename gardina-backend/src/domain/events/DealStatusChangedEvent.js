/**
 * DealStatusChangedEvent
 * Domain event emitted when deal status changes
 */
export class DealStatusChangedEvent {
  constructor({ dealId, oldStatus, newStatus, timestamp }) {
    this.eventType = 'DealStatusChanged';
    this.dealId = dealId;
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
    this.timestamp = timestamp || new Date();
  }

  toJSON() {
    return {
      eventType: this.eventType,
      dealId: this.dealId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      timestamp: this.timestamp,
    };
  }
}
