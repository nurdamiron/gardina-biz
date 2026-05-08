/**
 * DealCreatedEvent
 * Domain event emitted when a new deal is created
 */
export class DealCreatedEvent {
  constructor({ dealId, clientId, designerId, timestamp }) {
    this.eventType = 'DealCreated';
    this.dealId = dealId;
    this.clientId = clientId;
    this.designerId = designerId;
    this.timestamp = timestamp || new Date();
  }

  toJSON() {
    return {
      eventType: this.eventType,
      dealId: this.dealId,
      clientId: this.clientId,
      designerId: this.designerId,
      timestamp: this.timestamp,
    };
  }
}
