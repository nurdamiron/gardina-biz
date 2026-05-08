import { PostgresProposalRepository } from '../../../infrastructure/repositories/PostgresProposalRepository.js';
import { PostgresDealRepository } from '../../../infrastructure/repositories/PostgresDealRepository.js';
import { PostgresMeasurementRepository } from '../../../infrastructure/repositories/PostgresMeasurementRepository.js';

/**
 * Proposal Controller
 */
export class ProposalController {
  constructor() {
    this.proposalRepository = new PostgresProposalRepository();
    this.dealRepository = new PostgresDealRepository();
    this.measurementRepository = new PostgresMeasurementRepository();
  }

  _canAccess(user, proposal) {
    if (user.role === 'admin') return true;
    if (user.role === 'designer') return proposal.designer_id === user.id;
    if (user.role === 'manager' || user.role === 'sales') {
      return proposal.client_created_by === user.id;
    }
    return false;
  }

  async create(req, res) {
    try {
      const {
        measurementId,
        clientId,
        dealId,
        variantName,
        fabricCost,
        sewingCost,
        installationCost,
        totalCost,
        notes,
      } = req.body;

      // Designer must always be the authenticated user (or admin can pass designerId explicitly)
      const designerId = req.user.role === 'designer' ? req.user.id : (req.body.designerId || req.user.id);

      // Create proposal
      const proposal = await this.proposalRepository.create({
        measurementId,
        clientId,
        designerId,
        variantName,
        fabricCost,
        sewingCost,
        installationCost,
        totalCost,
        status: 'draft',
        notes,
      });

      // Update deal with proposal and total amount
      if (dealId) {
        const deal = await this.dealRepository.findById(dealId);
        if (deal) {
          deal.attachProposal(proposal.id, totalCost);
          await this.dealRepository.save(deal);
        }
      }

      // Complete measurement
      if (measurementId) {
        const measurement = await this.measurementRepository.findEntityById(measurementId);
        if (measurement) {
          try {
            measurement.complete();
            await this.measurementRepository.save(measurement);
          } catch (error) {
            // Log but don't fail the proposal creation if measurement can't be completed
          }
        }
      }

      res.status(201).json({
        success: true,
        data: proposal,
        message: 'Proposal created successfully',
      });
    } catch (error) {
      console.error(`[ProposalController.create] Failed to create proposal for measurement ${req.body.measurementId}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const proposal = await this.proposalRepository.findById(req.params.id);

      if (!proposal) {
        return res.status(404).json({ success: false, error: 'Proposal not found' });
      }

      if (!this._canAccess(req.user, proposal)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      res.json({ success: true, data: proposal });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {
        clientId: req.query.clientId,
        status: req.query.status,
      };

      // Role-based filtering
      if (req.user.role === 'designer') {
        filters.designerId = req.user.id;
      } else if (req.user.role === 'manager' || req.user.role === 'sales') {
        filters.managerId = req.user.id;
      } else if (req.query.designerId) {
        filters.designerId = req.query.designerId;
      }

      const pagination = {
        offset: parseInt(req.query.offset) || 0,
        limit: parseInt(req.query.limit) || 50,
      };

      const result = await this.proposalRepository.findAll(filters, pagination);

      res.json({
        success: true,
        data: result.proposals,
        total: result.total,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      const existing = await this.proposalRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Proposal not found' });
      }

      if (!this._canAccess(req.user, existing)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const updatedProposal = await this.proposalRepository.update(id, req.body);

      res.json({
        success: true,
        data: updatedProposal,
        message: 'Proposal updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await this.proposalRepository.findById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Proposal not found' });
      }

      if (!this._canAccess(req.user, existing)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const deleted = await this.proposalRepository.delete(id);

      if (deleted) {
        res.json({
          success: true,
          message: 'Proposal deleted successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete proposal',
        });
      }
    } catch (error) {
      // If FK constraint violation
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete proposal - it is referenced by deals or other records',
        });
      }
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
