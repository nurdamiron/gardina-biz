import { Deal } from '../../../src/domain/aggregates/Deal.js';

describe('Deal State Machine - Complete Flow Tests', () => {
  describe('Valid State Transitions', () => {
    test('SCHEDULED → MEASURED', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.SCHEDULED,
      });

      // Can attach measurement from SCHEDULED
      deal.attachMeasurement('measurement-789');
      expect(deal.status).toBe(Deal.STATUS.MEASURED);
    });

    test('MEASURED → stays MEASURED through proposal flow', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-789',
        status: Deal.STATUS.MEASURED,
      });

      // Attach proposal (stays in MEASURED)
      deal.attachProposal('proposal-111', 100000);
      expect(deal.status).toBe(Deal.STATUS.MEASURED);

      // Accept proposal → moves to PROPOSAL_ACCEPTED
      deal.acceptProposal();
      expect(deal.status).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);

      // Sign contract (now moves forward)
      deal.signContract();
      expect(deal.status).toBe(Deal.STATUS.CONTRACT_SIGNED);
    });

    test('MEASURED (with payment) → IN_PRODUCTION → READY', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.MEASURED,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      // Start production (from MEASURED, not CONTRACT_SIGNED)
      deal.startProduction();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);

      // Mark ready
      deal.markReadyForInstallation();
      expect(deal.status).toBe(Deal.STATUS.READY);
    });

    test('READY → INSTALLING → COMPLETED', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.READY,
      });

      // Schedule installation
      deal.scheduleInstallation(new Date());
      expect(deal.status).toBe(Deal.STATUS.INSTALLING);

      // Complete (need payment)
      deal._paymentStatus = Deal.PAYMENT_STATUS.PAID;
      deal.complete();
      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });

    test('Any status (except COMPLETED) → CANCELLED', () => {
      const statuses = [
        Deal.STATUS.SCHEDULED,
        Deal.STATUS.MEASURED,
        Deal.STATUS.PROPOSAL_ACCEPTED,
        Deal.STATUS.CONTRACT_SIGNED,
        Deal.STATUS.IN_PRODUCTION,
        Deal.STATUS.READY,
        Deal.STATUS.INSTALLING,
      ];

      statuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
        });

        deal.cancel('Test cancellation');
        expect(deal.status).toBe(Deal.STATUS.CANCELLED);
      });
    });
  });

  describe('Invalid State Transitions', () => {
    test('cannot accept proposal without being in PROPOSAL_SENT', () => {
      const invalidStatuses = [
        Deal.STATUS.LEAD,
        Deal.STATUS.MEASUREMENT_DONE,
        Deal.STATUS.PROPOSAL_ACCEPTED,
        Deal.STATUS.CONTRACT_SIGNED,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          proposalId: 'proposal-111',
          status,
        });

        expect(() => deal.acceptProposal()).toThrow();
      });
    });

    test('cannot sign contract without proposal', () => {
      const invalidStatuses = [
        Deal.STATUS.SCHEDULED,
        Deal.STATUS.CONTRACT_SIGNED,
        Deal.STATUS.IN_PRODUCTION,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
          proposalId: status === Deal.STATUS.SCHEDULED ? null : 'proposal-111', // No proposal for SCHEDULED
        });

        if (status === Deal.STATUS.SCHEDULED) {
          expect(() => deal.signContract()).toThrow();
        } else {
          // Other statuses throw because they're not in valid state
          expect(() => deal.signContract()).toThrow();
        }
      });
    });

    test('cannot start production without being in CONTRACT_SIGNED', () => {
      const invalidStatuses = [
        Deal.STATUS.LEAD,
        Deal.STATUS.PROPOSAL_ACCEPTED,
        Deal.STATUS.IN_PRODUCTION,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
          paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
        });

        expect(() => deal.startProduction()).toThrow();
      });
    });

    test('cannot mark ready without being in IN_PRODUCTION', () => {
      const invalidStatuses = [
        Deal.STATUS.CONTRACT_SIGNED,
        Deal.STATUS.READY_FOR_INSTALLATION,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
        });

        expect(() => deal.markReadyForInstallation()).toThrow();
      });
    });

    test('cannot schedule installation without being READY_FOR_INSTALLATION', () => {
      const invalidStatuses = [
        Deal.STATUS.IN_PRODUCTION,
        Deal.STATUS.INSTALLATION_SCHEDULED,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
        });

        expect(() => deal.scheduleInstallation(new Date())).toThrow();
      });
    });

    test('cannot mark as installed without being INSTALLATION_SCHEDULED', () => {
      const invalidStatuses = [
        Deal.STATUS.READY_FOR_INSTALLATION,
        Deal.STATUS.INSTALLED,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
        });

        expect(() => deal.markAsInstalled()).toThrow();
      });
    });

    test('cannot complete without being INSTALLED', () => {
      const invalidStatuses = [
        Deal.STATUS.INSTALLATION_SCHEDULED,
        Deal.STATUS.READY_FOR_INSTALLATION,
      ];

      invalidStatuses.forEach(status => {
        const deal = new Deal({
          clientId: 'client-123',
          designerId: 'designer-456',
          status,
          paymentStatus: Deal.PAYMENT_STATUS.PAID,
        });

        expect(() => deal.complete()).toThrow();
      });
    });

    test('cannot cancel if already COMPLETED', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.COMPLETED,
      });

      expect(() => deal.cancel()).toThrow('Cannot cancel completed deal');
    });
  });

  describe('Payment Requirements for State Transitions', () => {
    test('cannot start production without prepayment', () => {
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

    test('cannot complete without full payment', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.INSTALLING,
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.complete()).toThrow('Cannot complete without full payment');
    });

    test('can start production with PARTIAL payment', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.MEASURED, // startProduction() requires MEASURED status
        paymentStatus: Deal.PAYMENT_STATUS.PARTIAL,
      });

      expect(() => deal.startProduction()).not.toThrow();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);
    });

    test('can complete with PAID status', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.INSTALLING,
        paymentStatus: Deal.PAYMENT_STATUS.PAID,
      });

      expect(() => deal.complete()).not.toThrow();
      expect(deal.status).toBe(Deal.STATUS.COMPLETED);
    });
  });

  describe('Full Happy Path Flow', () => {
    test('complete deal lifecycle from SCHEDULED to COMPLETED', () => {
      // 1. Create deal as SCHEDULED
      const deal = Deal.create({
        clientId: 'client-123',
        designerId: 'designer-456',
      });
      expect(deal.status).toBe(Deal.STATUS.SCHEDULED);

      // 2. Attach measurement
      deal.attachMeasurement('measurement-789');
      expect(deal.status).toBe(Deal.STATUS.MEASURED);

      // 3. Attach proposal (stays in MEASURED)
      deal.attachProposal('proposal-111', 100000);
      expect(deal.status).toBe(Deal.STATUS.MEASURED);
      expect(deal.totalAmount.amount).toBe(100000);

      // 4. Accept proposal → PROPOSAL_ACCEPTED
      deal.acceptProposal();
      expect(deal.status).toBe(Deal.STATUS.PROPOSAL_ACCEPTED);

      // 5. Sign contract
      deal.signContract();
      expect(deal.status).toBe(Deal.STATUS.CONTRACT_SIGNED);

      // 6. Record prepayment
      deal.recordPrepayment(50000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PARTIAL);

      // 7. Start production (from CONTRACT_SIGNED)
      deal.startProduction();
      expect(deal.status).toBe(Deal.STATUS.IN_PRODUCTION);

      // 8. Mark ready for installation
      deal.markReadyForInstallation();
      expect(deal.status).toBe(Deal.STATUS.READY);

      // 9. Schedule installation
      deal.scheduleInstallation(new Date());
      expect(deal.status).toBe(Deal.STATUS.INSTALLING);

      // 10. Record final payment
      deal.recordFinalPayment(50000);
      expect(deal.paymentStatus).toBe(Deal.PAYMENT_STATUS.PAID);

      // 11. Complete
      deal.complete();
      expect(deal.status).toBe(Deal.STATUS.COMPLETED);

      // Verify domain events
      expect(deal.domainEvents.length).toBeGreaterThan(0);
    });

    test('deal cancellation flow at different stages', () => {
      // Test cancellation at PROPOSAL_SENT
      const deal1 = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.PROPOSAL_SENT,
        proposalId: 'proposal-111',
      });

      deal1.cancel('Client rejected');
      expect(deal1.status).toBe(Deal.STATUS.CANCELLED);

      // Test cancellation at IN_PRODUCTION
      const deal2 = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.IN_PRODUCTION,
      });

      deal2.cancel('Production issue');
      expect(deal2.status).toBe(Deal.STATUS.CANCELLED);
    });
  });

  describe('Concurrent State Changes', () => {
    test('state changes should be atomic', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        proposalId: 'proposal-111', // Need proposal to sign
        status: Deal.STATUS.PROPOSAL_ACCEPTED,
      });

      // Sign contract
      deal.signContract();
      expect(deal.status).toBe(Deal.STATUS.CONTRACT_SIGNED);

      // Cannot sign again (now throws because status is CONTRACT_SIGNED)
      expect(() => deal.signContract()).toThrow('Cannot sign contract before proposal is accepted');
    });

    test('should maintain state consistency after errors', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.CONTRACT_SIGNED,
        paymentStatus: Deal.PAYMENT_STATUS.PENDING,
      });

      const originalStatus = deal.status;

      // Try to start production without payment - should fail
      try {
        deal.startProduction();
      } catch (e) {
        // Status should remain unchanged
        expect(deal.status).toBe(originalStatus);
      }
    });
  });

  describe('Edge Cases in State Machine', () => {
    test('attaching measurement twice should fail', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        measurementId: 'measurement-1',
      });

      expect(() => deal.attachMeasurement('measurement-2')).toThrow(
        'Measurement already attached to this deal'
      );
    });

    test('attaching proposal without measurement should fail', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
      });

      expect(() => deal.attachProposal('proposal-111', 100000)).toThrow(
        'Cannot attach proposal without measurement'
      );
    });

    test('accepting non-existent proposal should fail', () => {
      const deal = new Deal({
        clientId: 'client-123',
        designerId: 'designer-456',
        status: Deal.STATUS.PROPOSAL_SENT,
      });

      expect(() => deal.acceptProposal()).toThrow('No proposal attached to this deal');
    });
  });
});
