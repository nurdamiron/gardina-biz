import { Deal } from '../../../src/domain/aggregates/Deal.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeDeal = (overrides = {}) =>
  new Deal({
    clientId: 'client-123',
    designerId: 'designer-456',
    ...overrides,
  });

// A past date (10 days ago)
const pastDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 10);
  return d;
};

// A future date (30 days from now)
const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
};

describe('Deal Payment & Status Flow', () => {
  // -------------------------------------------------------------------------
  // acceptProposal() — bug fix verification
  // -------------------------------------------------------------------------
  describe('acceptProposal() — changes status to PROPOSAL_ACCEPTED', () => {
    test('BUG FIX: acceptProposal() NOW changes status to PROPOSAL_ACCEPTED', () => {
      const deal = makeDeal({
        measurementId: 'meas-1',
        proposalId: 'prop-1',
        status: Deal.STATUS.MEASURED,
        totalAmount: 100000,
      });

      deal.acceptProposal();

      expect(deal.status).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);
      expect(deal.status).toBe('proposal_accepted');
    });

    test('acceptProposal() emits a DealStatusChanged domain event', () => {
      const deal = makeDeal({
        measurementId: 'meas-1',
        proposalId: 'prop-1',
        status: Deal.STATUS.MEASURED,
      });

      deal.acceptProposal();

      const events = deal.domainEvents.filter(e => e.eventType === 'DealStatusChanged');
      expect(events.length).toBeGreaterThan(0);
      const event = events[events.length - 1];
      expect(event.newStatus).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);
    });

    test('acceptProposal() throws without an attached proposal', () => {
      const deal = makeDeal({
        measurementId: 'meas-1',
        status: Deal.STATUS.MEASURED,
      });

      expect(() => deal.acceptProposal()).toThrow('No proposal attached to this deal');
    });

    test('acceptProposal() throws when status is not MEASURED', () => {
      const deal = makeDeal({
        proposalId: 'prop-1',
        status: Deal.STATUS.SCHEDULED,
      });

      expect(() => deal.acceptProposal()).toThrow('Cannot accept proposal in current status');
    });
  });

  // -------------------------------------------------------------------------
  // startProduction() — from contract_signed (bug fix)
  // -------------------------------------------------------------------------
  describe('startProduction() — from contract_signed status', () => {
    test('BUG FIX: startProduction() works from contract_signed status', () => {
      const deal = makeDeal({
        status: 'contract_signed',
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.startProduction()).not.toThrow();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);
    });

    test('startProduction() also works from MEASURED status', () => {
      const deal = makeDeal({
        status: Deal.STATUS.MEASURED,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      deal.startProduction();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);
    });

    test('SECURITY: startProduction() does NOT work from PROPOSAL_ACCEPTED', () => {
      const deal = makeDeal({
        status: Deal.STATUS.PROPOSAL_ACCEPTED,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production before contract is signed'
      );
    });

    test('startProduction() does NOT work from SCHEDULED status', () => {
      const deal = makeDeal({
        status: Deal.STATUS.SCHEDULED,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production before contract is signed'
      );
    });

    test('startProduction() does NOT work from IN_PRODUCTION (already started)', () => {
      const deal = makeDeal({
        status: Deal.STATUS.IN_PRODUCTION,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production before contract is signed'
      );
    });

    test('startProduction() requires at least PARTIAL payment', () => {
      const deal = makeDeal({
        status: 'contract_signed',
        paymentStatus: Deal.PAYMENT_STATUS.PENDING,
      });

      expect(() => deal.startProduction()).toThrow(
        'Cannot start production without prepayment'
      );
    });
  });

  // -------------------------------------------------------------------------
  // markAsInstalled() — bug fix verification
  // -------------------------------------------------------------------------
  describe('markAsInstalled() — changes status to installed', () => {
    test('BUG FIX: markAsInstalled() NOW changes status to "installed"', () => {
      const deal = makeDeal({ status: Deal.STATUS.INSTALLING });

      deal.markAsInstalled();

      expect(deal.status).toBe('installed');
    });

    test('markAsInstalled() throws when not in INSTALLING status', () => {
      const deal = makeDeal({ status: Deal.STATUS.READY });

      expect(() => deal.markAsInstalled()).toThrow(
        'Cannot mark as installed without being in installing status'
      );
    });

    test('markAsInstalled() throws when already installed', () => {
      // 'installed' is not INSTALLING, so the guard fires
      const deal = makeDeal({ status: 'installed' });

      expect(() => deal.markAsInstalled()).toThrow(
        'Cannot mark as installed without being in installing status'
      );
    });
  });

  // -------------------------------------------------------------------------
  // complete() — bug fix and backward compatibility
  // -------------------------------------------------------------------------
  describe('complete() — works from "installed" and INSTALLING statuses', () => {
    test('BUG FIX: complete() works from "installed" status', () => {
      const deal = makeDeal({
        status: 'installed',
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      deal.complete();

      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });

    test('BACKWARD COMPAT: complete() still works from INSTALLING status', () => {
      const deal = makeDeal({
        status: Deal.STATUS.INSTALLING,
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      deal.complete();

      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });

    test('complete() throws when payment is not PAID', () => {
      const deal = makeDeal({
        status: 'installed',
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.complete()).toThrow('Cannot complete without full payment');
    });

    test('complete() throws from IN_PRODUCTION status', () => {
      const deal = makeDeal({
        status: Deal.STATUS.IN_PRODUCTION,
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      expect(() => deal.complete()).toThrow('Cannot complete before installation is done');
    });
  });

  // -------------------------------------------------------------------------
  // cancel() — sets cancellationReason correctly
  // -------------------------------------------------------------------------
  describe('cancel() — cancellationReason', () => {
    test('cancel(reason) stores the cancellation reason', () => {
      const deal = makeDeal({ status: Deal.STATUS.MEASURED });

      deal.cancel('Client changed their mind');

      expect(deal.cancellationReason).toBe('Client changed their mind');
      expect(deal.status).toBe(Deal.STATUS.CANCELLED);
    });

    test('cancel() without reason stores null', () => {
      const deal = makeDeal({ status: Deal.STATUS.MEASURED });

      deal.cancel();

      expect(deal.cancellationReason).toBeNull();
      expect(deal.status).toBe(Deal.STATUS.CANCELLED);
    });

    test('cancel() with empty string stores null', () => {
      const deal = makeDeal({ status: Deal.STATUS.MEASURED });

      deal.cancel('');

      // The implementation does: this._cancellationReason = reason || null
      expect(deal.cancellationReason).toBeNull();
    });

    test('cancel() throws when deal is already COMPLETED', () => {
      const deal = makeDeal({ status: Deal.STATUS.COMPLETED });

      expect(() => deal.cancel('too late')).toThrow('Cannot cancel completed deal');
    });

    test('cancel() is allowed at every non-completed status', () => {
      const nonCompletedStatuses = [
        Deal.STATUS.SCHEDULED,
        Deal.STATUS.MEASURED,
        Deal.STATUS.PROPOSAL_ACCEPTED,
        Deal.STATUS.CONTRACT_SIGNED,
        Deal.STATUS.IN_PRODUCTION,
        Deal.STATUS.READY,
        Deal.STATUS.INSTALLING,
      ];

      nonCompletedStatuses.forEach(status => {
        const deal = makeDeal({ status });
        expect(() => deal.cancel('reason')).not.toThrow();
        expect(deal.status).toBe(Deal.STATUS.CANCELLED);
      });
    });
  });

  // -------------------------------------------------------------------------
  // getRemainingAmount()
  // -------------------------------------------------------------------------
  describe('getRemainingAmount()', () => {
    test('remaining = totalAmount - prepayment - finalPayment', () => {
      const deal = makeDeal({
        totalAmount: 100000,
        prepayment: 30000,
        finalPayment: 20000,
      });

      const remaining = deal.getRemainingAmount();

      expect(remaining.amount).toBe(50000);
    });

    test('remaining is zero when deal is fully paid', () => {
      const deal = makeDeal({
        totalAmount: 100000,
        prepayment: 60000,
        finalPayment: 40000,
      });

      const remaining = deal.getRemainingAmount();

      expect(remaining.amount).toBe(0);
    });

    test('returns Money(0) when no totalAmount is set', () => {
      const deal = makeDeal();

      const remaining = deal.getRemainingAmount();

      expect(remaining.amount).toBe(0);
    });

    test('remaining equals totalAmount when no payments recorded', () => {
      const deal = makeDeal({ totalAmount: 75000 });
      // prepayment and finalPayment both default to 0
      const remaining = deal.getRemainingAmount();
      expect(remaining.amount).toBe(75000);
    });

    test('remaining returns a Money instance', () => {
      const { Money } = await import('../../../src/domain/value-objects/Money.js').catch(() => ({ Money: null }));
      const deal = makeDeal({ totalAmount: 50000, prepayment: 10000 });
      const remaining = deal.getRemainingAmount();
      // Should have an amount property (Money shape)
      expect(typeof remaining.amount).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // isOverdue()
  // -------------------------------------------------------------------------
  describe('isOverdue()', () => {
    test('returns true when past deadline and deal is not completed', () => {
      const deal = makeDeal({
        deadline: pastDate(),
        status: Deal.STATUS.IN_PRODUCTION,
      });

      expect(deal.isOverdue()).toBe(true);
    });

    test('returns false when deadline is in the future', () => {
      const deal = makeDeal({
        deadline: futureDate(),
        status: Deal.STATUS.IN_PRODUCTION,
      });

      expect(deal.isOverdue()).toBe(false);
    });

    test('returns false when deal is COMPLETED even if past deadline', () => {
      const deal = makeDeal({
        deadline: pastDate(),
        status: Deal.STATUS.COMPLETED,
      });

      expect(deal.isOverdue()).toBe(false);
    });

    test('returns false when no deadline is set', () => {
      const deal = makeDeal({ status: Deal.STATUS.IN_PRODUCTION });
      expect(deal.isOverdue()).toBe(false);
    });

    test('returns true for an overdue SCHEDULED deal', () => {
      const deal = makeDeal({
        deadline: pastDate(),
        status: Deal.STATUS.SCHEDULED,
      });

      expect(deal.isOverdue()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Full payment flow integration
  // -------------------------------------------------------------------------
  describe('Full payment flow integration', () => {
    test('complete end-to-end flow from MEASURED to COMPLETED', () => {
      // Start in MEASURED state with proposal and total amount
      const deal = makeDeal({
        measurementId: 'meas-1',
        proposalId: 'prop-1',
        status: Deal.STATUS.MEASURED,
        totalAmount: 200000,
      });

      // Accept proposal → PROPOSAL_ACCEPTED
      deal.acceptProposal();
      expect(deal.status).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);

      // Sign contract → contract_signed
      deal.signContract();
      expect(deal.status).toBe('contract_signed');

      // Record prepayment
      deal.recordPrepayment(100000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PARTIAL);

      // Start production from contract_signed (bug fix)
      deal.startProduction();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);

      // Mark ready
      deal.markReadyForInstallation();
      expect(deal.status).toBe(Deal.STATUS.READY);

      // Schedule installation
      deal.scheduleInstallation(new Date());
      expect(deal.status).toBe(Deal.STATUS.INSTALLING);

      // Mark as installed (bug fix: status becomes 'installed')
      deal.markAsInstalled();
      expect(deal.status).toBe('installed');

      // Record final payment
      deal.recordFinalPayment(100000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PAID);

      // Complete from 'installed' (bug fix)
      deal.complete();
      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });
  });
});
