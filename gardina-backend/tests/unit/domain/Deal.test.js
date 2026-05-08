import { Deal } from '../../../src/domain/aggregates/Deal.js';
import { Money } from '../../../src/domain/value-objects/Money.js';

describe('Deal Aggregate', () => {
  describe('Constructor', () => {
    test('should create Deal with required fields', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.clientId).toBe('client-123');
      expect(deal.designerId).toBe('designer-456');
      expect(deal.status).toBe(Deal.STATUS.SCHEDULED);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PENDING);
    });

    test('should throw error without clientId', () => {
      expect(() => new Deal({ designerId: 'designer-456' })).toThrow('Client ID is required');
    });

    test('should allow creation without designerId (nullable after migration 009)', () => {
      const deal = new Deal({ clientId: 'client-123' });
      
      expect(deal.clientId).toBe('client-123');
      expect(deal.designerId).toBeNull();
      expect(deal.status).toBe(Deal.STATUS.SCHEDULED);
    });

    test('should create Deal with designerId when provided', () => {
      const deal = new Deal({ 
        clientId: 'client-123',
        designerId: 'designer-456'
      });
      
      expect(deal.designerId).toBe('designer-456');
    });

    test('should initialize with default values', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.prepaymentPercent).toBe(50);
      expect(deal.designerCommissionPercent).toBe(7);
      expect(deal.prepayment.amount).toBe(0);
      expect(deal.finalPayment.amount).toBe(0);
    });
  });

  describe('create() factory method', () => {
    test('should create Deal with domain event', () => {
      const deal = Deal.create({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.domainEvents.length).toBe(1);
      expect(deal.domainEvents[0].eventType).toBe('DealCreated');
    });
  });

  describe('attachMeasurement()', () => {
    test('should attach measurement and change status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      deal.attachMeasurement('measurement-789');

      expect(deal.measurementId).toBe('measurement-789');
      expect(deal.status).toBe(Deal.STATUS.MEASURED);
    });

    test('should throw error if measurement already attached', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-111',
      });

      expect(() => deal.attachMeasurement('measurement-222')).toThrow(
        'Measurement already attached to this deal'
      );
    });
  });

  describe('attachProposal()', () => {
    test('should attach proposal and calculate amounts', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-789',
        status: Deal.STATUS.MEASURED,
      });

      deal.attachProposal('proposal-111', 100000);

      expect(deal.proposalId).toBe('proposal-111');
      expect(deal.totalAmount.amount).toBe(100000);
      expect(deal.prepayment.amount).toBe(50000); // 50% default
      expect(deal.finalPayment.amount).toBe(50000);
      expect(deal.status).toBe(Deal.STATUS.MEASURED); // Stays in MEASURED
    });

    test('should throw error without measurement', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(() => deal.attachProposal('proposal-111', 100000)).toThrow(
        'Cannot attach proposal without measurement'
      );
    });

    test('should respect custom prepayment percentage', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-789',
        status: Deal.STATUS.MEASURED,
        prepaymentPercent: 30,
      });

      deal.attachProposal('proposal-111', 100000);

      expect(deal.prepayment.amount).toBe(30000); // 30%
      expect(deal.finalPayment.amount).toBe(70000);
    });
  });

  describe('acceptProposal()', () => {
    test('should accept proposal', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-789',
        proposalId: 'proposal-111',
        status: Deal.STATUS.MEASURED,
        totalAmount: 100000,
      });

      deal.acceptProposal();

      expect(deal.status).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);
    });

    test('should throw error without proposal', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(() => deal.acceptProposal()).toThrow('No proposal attached to this deal');
    });

    test('should throw error in wrong status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        proposalId: 'proposal-111',
        status: Deal.STATUS.COMPLETED,
      });

      expect(() => deal.acceptProposal()).toThrow('Cannot accept proposal in current status');
    });
  });

  describe('recordPrepayment()', () => {
    test('should record prepayment correctly', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
      });

      deal.recordPrepayment(50000);

      expect(deal.prepayment.amount).toBe(50000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PARTIAL);
    });

    test('should throw error if amount is negative or zero', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
      });

      expect(() => deal.recordPrepayment(0)).toThrow('Payment amount must be positive');
      expect(() => deal.recordPrepayment(-100)).toThrow('Amount cannot be negative');
    });

    test('should throw error if prepayment exceeds total', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
      });

      expect(() => deal.recordPrepayment(150000)).toThrow(
        'Prepayment cannot exceed total amount'
      );
    });

    test('should throw error if totalAmount is null - BUG FIX', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      // This is the critical bug from the report
      expect(() => deal.recordPrepayment(50000)).toThrow(
        'Cannot record prepayment without total amount'
      );
    });
  });

  describe('recordFinalPayment()', () => {
    test('should record final payment', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
        prepayment: 50000,
      });

      deal.recordFinalPayment(50000);

      expect(deal.finalPayment.amount).toBe(50000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PAID);
    });

    test('should mark as paid when total matches', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
        prepayment: 40000,
      });

      deal.recordFinalPayment(60000);

      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PAID);
    });
  });

  describe('signContract()', () => {
    test('should sign contract', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        proposalId: 'proposal-111', // Need proposal to sign
        status: Deal.STATUS.PROPOSAL_ACCEPTED,
      });

      deal.signContract();

      expect(deal.status).toBe(Deal.STATUS.CONTRACT_SIGNED);
    });

    test('should throw error in wrong status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.SCHEDULED,
      });

      expect(() => deal.signContract()).toThrow(
        'Cannot sign contract before proposal is accepted'
      );
    });
  });

  describe('startProduction()', () => {
    test('should start production', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.MEASURED,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      deal.startProduction();

      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);
    });

    test('should throw error without prepayment', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.MEASURED,
        paymentStatus: Deal.PAYMENT_STATUS.PENDING,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production without prepayment'
      );
    });

    test('should throw error in wrong status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.SCHEDULED,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production before contract is signed'
      );
    });
  });

  describe('complete()', () => {
    test('should complete deal', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.INSTALLING,
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      deal.complete();

      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });

    test('should throw error without full payment', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.INSTALLING,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.complete()).toThrow('Cannot complete without full payment');
    });

    test('should throw error in wrong status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.IN_PRODUCTION,
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      expect(() => deal.complete()).toThrow('Cannot complete before installation is done');
    });
  });

  describe('cancel()', () => {
    test('should cancel deal', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.LEAD,
      });

      deal.cancel('Client changed mind');

      expect(deal.status).toBe(Deal.STATUS.CANCELLED);
    });

    test('should throw error if already completed', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.COMPLETED,
      });

      expect(() => deal.cancel()).toThrow('Cannot cancel completed deal');
    });
  });

  describe('getRemainingAmount()', () => {
    test('should calculate remaining amount', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
        prepayment: 30000,
        finalPayment: 20000,
      });

      const remaining = deal.getRemainingAmount();

      expect(remaining.amount).toBe(50000);
    });

    test('should return zero if no total amount', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      const remaining = deal.getRemainingAmount();

      expect(remaining.amount).toBe(0);
    });
  });

  describe('isOverdue()', () => {
    test('should return true if past deadline', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        deadline: pastDate,
        status: Deal.STATUS.IN_PRODUCTION,
      });

      expect(deal.isOverdue()).toBe(true);
    });

    test('should return false if completed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        deadline: pastDate,
        status: Deal.STATUS.COMPLETED,
      });

      expect(deal.isOverdue()).toBe(false);
    });

    test('should return false without deadline', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.isOverdue()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    test('should serialize to JSON', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        totalAmount: 100000,
      });

      const json = deal.toJSON();

      expect(json.clientId).toBe('client-123');
      expect(json.designerId).toBe('designer-456');
      expect(json.totalAmount.amount).toBe(100000);
    });
  });

  describe('Domain Events', () => {
    test('should emit DealCreated event', () => {
      const deal = Deal.create({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.domainEvents.length).toBeGreaterThan(0);
      expect(deal.domainEvents[0].dealId).toBe(deal.id);
    });

    test('should emit StatusChanged event on measurement attach', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.SCHEDULED,
      });

      deal.attachMeasurement('measurement-789');

      const statusEvents = deal.domainEvents.filter(e => e.eventType === 'DealStatusChanged');
      expect(statusEvents.length).toBeGreaterThan(0);
    });

    test('should clear domain events', () => {
      const deal = Deal.create({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(deal.domainEvents.length).toBeGreaterThan(0);
      deal.clearDomainEvents();
      expect(deal.domainEvents.length).toBe(0);
    });
  });
});
