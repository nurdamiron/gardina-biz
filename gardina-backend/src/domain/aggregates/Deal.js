import { BaseEntity } from '../entities/BaseEntity.js';
import { Money } from '../value-objects/Money.js';
import { DealCreatedEvent } from '../events/DealCreatedEvent.js';
import { DealStatusChangedEvent } from '../events/DealStatusChangedEvent.js';

/**
 * Deal Aggregate Root
 * Core business entity representing a deal/order in the system
 */
export class Deal extends BaseEntity {
  // Deal statuses — MUST match the Postgres deal_status ENUM exactly, otherwise
  // any write of an unknown value 500s with "invalid input value for enum
  // deal_status". DB enum: lead, measurement_scheduled, measurement_done,
  // proposal_sent, proposal_accepted, contract_signed, in_production,
  // ready_for_installation, installation_scheduled, installed, completed, cancelled.
  static STATUS = {
    SCHEDULED: 'measurement_scheduled',     // Measurement scheduled
    MEASURED: 'measurement_done',           // Measurement completed
    PROPOSAL_SENT: 'proposal_sent',         // Proposal sent to client
    PROPOSAL_ACCEPTED: 'proposal_accepted', // Client accepted proposal
    CONTRACT_SIGNED: 'contract_signed',     // Contract signed, prepayment received
    IN_PRODUCTION: 'in_production',          // Production in progress
    READY: 'ready_for_installation',        // Ready for installation
    INSTALLING: 'installation_scheduled',   // Installation scheduled/in progress
    INSTALLED: 'installed',                  // Installation done
    COMPLETED: 'completed',                  // Deal completed
    CANCELLED: 'cancelled',                  // Deal cancelled
    REJECTED: 'cancelled',                   // Client rejected proposal -> deal cancelled (no 'rejected' enum value)
  };

  // Payment statuses
  static PAYMENT_STATUS = {
    PENDING: 'pending',
    PARTIAL: 'partial',
    PAID: 'paid',
    REFUNDED: 'refunded',
  };

  constructor({
    id,
    clientId,
    designerId = null,
    measurementId = null,
    proposalId = null,
    status = Deal.STATUS.SCHEDULED,
    totalAmount = null,
    prepayment = 0,
    prepaymentPercent = 50,
    finalPayment = 0,
    paymentStatus = Deal.PAYMENT_STATUS.PENDING,
    deadline = null,
    designerCommissionPercent = 7,
    designerCommission = null,
    installationDate = null,
    cancellationReason = null,
    createdAt,
    updatedAt,
  }) {
    super(id);

    if (!clientId) throw new Error('Client ID is required');

    this._clientId = clientId;
    this._designerId = designerId; // Nullable - allows keeping deals if designer is deleted
    this._measurementId = measurementId;
    this._proposalId = proposalId;
    this._status = status;
    this._totalAmount = totalAmount ? new Money(totalAmount) : null;
    this._prepayment = new Money(prepayment);
    this._prepaymentPercent = prepaymentPercent;
    this._finalPayment = new Money(finalPayment);
    this._paymentStatus = paymentStatus;
    this._deadline = deadline ? new Date(deadline) : null;
    this._designerCommissionPercent = designerCommissionPercent;
    this._designerCommission = designerCommission ? new Money(designerCommission) : null;
    this._installationDate = installationDate ? new Date(installationDate) : null;
    this._cancellationReason = cancellationReason;

    if (createdAt) this._createdAt = new Date(createdAt);
    if (updatedAt) this._updatedAt = new Date(updatedAt);

    // Domain events
    this._domainEvents = [];
  }

  // Getters
  get clientId() {
    return this._clientId;
  }

  get designerId() {
    return this._designerId;
  }

  get measurementId() {
    return this._measurementId;
  }

  get proposalId() {
    return this._proposalId;
  }

  get status() {
    return this._status;
  }

  get totalAmount() {
    return this._totalAmount;
  }

  get prepayment() {
    return this._prepayment;
  }

  get prepaymentPercent() {
    return this._prepaymentPercent;
  }

  get finalPayment() {
    return this._finalPayment;
  }

  get paymentStatus() {
    return this._paymentStatus;
  }

  get deadline() {
    return this._deadline;
  }

  get designerCommissionPercent() {
    return this._designerCommissionPercent;
  }

  get designerCommission() {
    return this._designerCommission;
  }

  get installationDate() {
    return this._installationDate;
  }

  get cancellationReason() {
    return this._cancellationReason;
  }

  get domainEvents() {
    return [...this._domainEvents];
  }

  // Business methods

  /**
   * Attach measurement to deal
   */
  attachMeasurement(measurementId) {
    if (this._measurementId) {
      throw new Error('Measurement already attached to this deal');
    }
    this._measurementId = measurementId;
    this.changeStatus(Deal.STATUS.MEASURED);
    this._markAsUpdated();
  }

  /**
   * Attach proposal to deal
   */
  attachProposal(proposalId, totalAmount) {
    if (!this._measurementId) {
      throw new Error('Cannot attach proposal without measurement');
    }

    this._proposalId = proposalId;
    this._totalAmount = new Money(totalAmount);

    // Calculate prepayment and commission
    this._prepayment = this._totalAmount.percentage(this._prepaymentPercent);
    this._finalPayment = this._totalAmount.subtract(this._prepayment);
    this._designerCommission = this._totalAmount.percentage(this._designerCommissionPercent);

    // Stay in MEASURED status - proposal sent but not yet accepted
    this._markAsUpdated();
  }

  /**
   * Accept proposal
   */
  acceptProposal() {
    if (!this._proposalId) {
      throw new Error('No proposal attached to this deal');
    }
    if (this._status !== Deal.STATUS.MEASURED) {
      throw new Error('Cannot accept proposal in current status');
    }

    this.changeStatus(Deal.STATUS.PROPOSAL_ACCEPTED);
    this._markAsUpdated();
  }

  /**
   * Sign contract
   */
  signContract() {
    // Check if proposal was accepted (status is MEASURED with proposalId)
    if (!this._proposalId) {
      throw new Error('Cannot sign contract before proposal is accepted');
    }
    
    // Can sign from MEASURED or PROPOSAL_ACCEPTED
    if (this._status !== Deal.STATUS.MEASURED && 
        this._status !== Deal.STATUS.PROPOSAL_ACCEPTED &&
        this._status !== 'proposal_accepted') {
      throw new Error('Cannot sign contract before proposal is accepted');
    }
    
    this.changeStatus('contract_signed'); // New status for inventory trigger
    this._markAsUpdated();
  }

  /**
   * Record prepayment
   */
  recordPrepayment(amount) {
    if (!this._totalAmount) {
      throw new Error('Cannot record prepayment without total amount');
    }

    const payment = new Money(amount);

    if (payment.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (payment.isGreaterThan(this._totalAmount)) {
      throw new Error('Prepayment cannot exceed total amount');
    }

    this._prepayment = payment;
    this._paymentStatus = Deal.PAYMENT_STATUS.PARTIAL;
    this._markAsUpdated();
  }

  /**
   * Record final payment
   */
  recordFinalPayment(amount) {
    const payment = new Money(amount);

    if (payment.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    this._finalPayment = payment;

    // Check if fully paid
    const totalPaid = this._prepayment.add(this._finalPayment);
    if (totalPaid.equals(this._totalAmount) || totalPaid.isGreaterThan(this._totalAmount)) {
      this._paymentStatus = Deal.PAYMENT_STATUS.PAID;
    }

    this._markAsUpdated();
  }

  /**
   * Start production
   */
  startProduction() {
    const allowedStatuses = [
      Deal.STATUS.MEASURED,
      'contract_signed',
    ];
    if (!allowedStatuses.includes(this._status)) {
      throw new Error('Cannot start production before contract is signed');
    }

    if (this._paymentStatus === Deal.PAYMENT_STATUS.PENDING) {
      throw new Error('Cannot start production without prepayment');
    }

    this.changeStatus(Deal.STATUS.IN_PRODUCTION);
    this._markAsUpdated();
  }

  /**
   * Mark as ready for installation
   */
  markReadyForInstallation() {
    if (this._status !== Deal.STATUS.IN_PRODUCTION) {
      throw new Error('Cannot mark ready before production is complete');
    }

    this.changeStatus(Deal.STATUS.READY);
    this._markAsUpdated();
  }

  /**
   * Schedule installation
   */
  scheduleInstallation(installationDate) {
    if (this._status !== Deal.STATUS.READY) {
      throw new Error('Cannot schedule installation before production is ready');
    }

    this._installationDate = installationDate ? new Date(installationDate) : null;
    this.changeStatus(Deal.STATUS.INSTALLING);
    this._markAsUpdated();
  }

  /**
   * Mark as installed
   */
  markAsInstalled() {
    if (this._status !== Deal.STATUS.INSTALLING) {
      throw new Error('Cannot mark as installed without being in installing status');
    }

    this.changeStatus('installed');
    this._markAsUpdated();
  }

  /**
   * Complete deal
   */
  complete() {
    if (this._status !== Deal.STATUS.INSTALLING && this._status !== 'installed') {
      throw new Error('Cannot complete before installation is done');
    }

    if (this._paymentStatus !== Deal.PAYMENT_STATUS.PAID) {
      throw new Error('Cannot complete without full payment');
    }

    this.changeStatus(Deal.STATUS.COMPLETED);
    this._markAsUpdated();
  }

  /**
   * Cancel deal
   */
  cancel(reason) {
    if (this._status === Deal.STATUS.COMPLETED) {
      throw new Error('Cannot cancel completed deal');
    }

    this._cancellationReason = reason || null;
    this.changeStatus(Deal.STATUS.CANCELLED);
    this._markAsUpdated();

    // TODO: Add domain event for cancellation
  }

  /**
   * Change status and emit event
   */
  changeStatus(newStatus) {
    const oldStatus = this._status;
    this._status = newStatus;

    this._domainEvents.push(
      new DealStatusChangedEvent({
        dealId: this._id,
        oldStatus,
        newStatus,
        timestamp: new Date(),
      })
    );
  }

  /**
   * Clear domain events (after they're published)
   */
  clearDomainEvents() {
    this._domainEvents = [];
  }

  /**
   * Check if deal is overdue
   */
  isOverdue() {
    if (!this._deadline) return false;
    return new Date() > this._deadline && this._status !== Deal.STATUS.COMPLETED;
  }

  /**
   * Get remaining amount to pay
   */
  getRemainingAmount() {
    if (!this._totalAmount) return new Money(0);

    const paid = this._prepayment.add(this._finalPayment);
    return this._totalAmount.subtract(paid);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      clientId: this._clientId,
      designerId: this._designerId,
      measurementId: this._measurementId,
      proposalId: this._proposalId,
      status: this._status,
      totalAmount: this._totalAmount?.toJSON(),
      prepayment: this._prepayment.toJSON(),
      prepaymentPercent: this._prepaymentPercent,
      finalPayment: this._finalPayment.toJSON(),
      paymentStatus: this._paymentStatus,
      deadline: this._deadline,
      designerCommissionPercent: this._designerCommissionPercent,
      designerCommission: this._designerCommission?.toJSON(),
      installationDate: this._installationDate,
      cancellationReason: this._cancellationReason,
    };
  }

  static create(props) {
    const deal = new Deal(props);

    // Emit domain event
    deal._domainEvents.push(
      new DealCreatedEvent({
        dealId: deal.id,
        clientId: props.clientId,
        designerId: props.designerId,
        timestamp: new Date(),
      })
    );

    return deal;
  }
}
