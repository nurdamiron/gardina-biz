import { PostgresDealRepository } from '../../../infrastructure/repositories/PostgresDealRepository.js';
import { PostgresClientRepository } from '../../../infrastructure/repositories/PostgresClientRepository.js';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import { PostgresDealEventsRepository } from '../../../infrastructure/repositories/PostgresDealEventsRepository.js';
import { CreateDealUseCase } from '../../../application/use-cases/CreateDealUseCase.js';

/**
 * Deal Controller
 * Handles HTTP requests for deals
 */
export class DealController {
  constructor() {
    this.dealRepository = new PostgresDealRepository();
    this.clientRepository = new PostgresClientRepository();
    this.userRepository = new PostgresUserRepository();
    this.dealEventsRepository = new PostgresDealEventsRepository();
  }

  _canAccess(user, deal) {
    if (user.role === 'admin') return true;
    if (user.role === 'designer') return deal.designerId === user.id;
    if (user.role === 'manager' || user.role === 'sales') {
      return deal.client?.createdBy === user.id;
    }
    return false;
  }

  /**
   * GET /api/deals/funnel
   * Get funnel statistics
   */
  async getFunnel(req, res) {
    try {
      const { designerId, clientId, startDate, endDate } = req.query;

      const filters = {};

      if (req.user.role === 'designer') {
        filters.designerId = req.user.id;
      } else if (req.user.role === 'manager' || req.user.role === 'sales') {
        filters.managerId = req.user.id;
      } else if (designerId) {
        filters.designerId = designerId;
      }

      if (clientId) filters.clientId = clientId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = await this.dealRepository.getFunnelStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(`[DealController.getFunnel] Failed to fetch funnel stats: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch funnel stats',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/deals
   * Get all deals with filters
   */
  async getAll(req, res) {
    try {
      const { status, clientId, designerId, managerId, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;

      // Role-based access control
      if (req.user.role === 'designer') {
        filters.designerId = req.user.id;
      } else if (req.user.role === 'manager' || req.user.role === 'sales') {
        filters.managerId = req.user.id;
      } else if (designerId) {
        filters.designerId = designerId;
      }

      const pagination = {
        offset: (page - 1) * limit,
        limit: parseInt(limit),
      };

      const result = await this.dealRepository.findAll(filters, pagination);

      res.json({
        success: true,
        data: result.deals, // Already JSON objects from repository
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error(`[DealController.getAll] Failed to fetch deals: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch deals',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/deals/:id
   * Get deal by ID with all relations and events
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const deal = await this.dealRepository.findByIdWithRelations(id);

      if (!deal) {
        return res.status(404).json({ success: false, error: 'Deal not found' });
      }

      if (!this._canAccess(req.user, deal)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      // Fetch deal events
      const events = await this.dealEventsRepository.findByDealId(id);

      res.json({
        success: true,
        data: {
          ...deal,
          events,
        },
      });
    } catch (error) {
      console.error(`[DealController.getById] Failed to fetch deal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch deal',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/deals
   * Create a new deal
   */
  async create(req, res) {
    try {
      const { 
        clientId, 
        designerId,
        measurementId,
        proposalId,
        status,
        totalAmount,
        prepayment,
        prepaymentPercent,
        finalPayment,
        paymentStatus,
        deadline
      } = req.body;
      
      if (!clientId || !designerId) {
        return res.status(400).json({
          success: false,
          error: 'clientId and designerId are required',
        });
      }

      // Use the CreateDealUseCase
      const useCase = new CreateDealUseCase(
        this.dealRepository,
        this.clientRepository,
        this.userRepository
      );

      const result = await useCase.execute({
        clientId,
        designerId,
        measurementId,
        proposalId,
        status,
        totalAmount,
        prepayment,
        prepaymentPercent,
        finalPayment,
        paymentStatus,
        deadline
      }, req.user);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Deal created successfully',
      });
    } catch (error) {
      console.error(`[DealController.create] Failed to create deal for client ${req.body.clientId}: ${error.message}`);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create deal',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/deals/:id/status
   * Change deal status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, data } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const dealCheck = await this.dealRepository.findByIdWithRelations(id);

      if (!dealCheck) {
        return res.status(404).json({ success: false, error: 'Deal not found' });
      }

      if (!this._canAccess(req.user, dealCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const deal = await this.dealRepository.findById(id);

      // Call appropriate business method based on status
      switch (status) {
        case 'proposal_accepted':
          deal.acceptProposal();
          break;
        case 'contract_signed':
          deal.signContract();
          break;
        case 'in_production':
          deal.startProduction();
          break;
        case 'ready_for_installation':
          deal.markReadyForInstallation();
          break;
        case 'installation_scheduled':
          deal.scheduleInstallation(data?.installationDate);
          break;
        case 'installed':
          deal.markAsInstalled();
          break;
        case 'completed':
          deal.complete();
          break;
        case 'cancelled':
          deal.cancel(data?.reason);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid status transition',
          });
      }

      const updatedDeal = await this.dealRepository.save(deal);

      // Trigger Inventory Deduction if contract signed
      if (status === 'contract_signed') {
         try {
           const { InventoryService } = await import('../../../domain/services/InventoryService.js');
           await InventoryService.deductStockForDeal(deal.id, req.user?.id);
         } catch (e) {
            console.error('Failed to deduct stock:', e);
         }
      }

      // Restore inventory if deal is cancelled
      if (status === 'cancelled') {
         try {
           const { InventoryService } = await import('../../../domain/services/InventoryService.js');
           await InventoryService.restoreStockForDeal(deal.id, req.user?.id);
         } catch (e) {
            console.error('Failed to restore stock:', e);
         }
      }

      res.json({
        success: true,
        data: updatedDeal.toJSON(),
        message: 'Deal status updated successfully',
      });
    } catch (error) {
      console.error(`[DealController.updateStatus] Failed to update deal ${req.params.id} to status ${req.body.status}: ${error.message}`);

      if (error.message.includes('Cannot')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update deal status',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/deals/:id/payment
   * Record payment
   */
  async recordPayment(req, res) {
    try {
      const { id } = req.params;
      const { type, amount } = req.body;

      if (!type || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Payment type and amount are required',
        });
      }

      const dealCheck = await this.dealRepository.findByIdWithRelations(id);

      if (!dealCheck) {
        return res.status(404).json({ success: false, error: 'Deal not found' });
      }

      if (!this._canAccess(req.user, dealCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const deal = await this.dealRepository.findById(id);

      if (type === 'prepayment') {
        deal.recordPrepayment(amount);
      } else if (type === 'final') {
        deal.recordFinalPayment(amount);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment type. Use "prepayment" or "final"',
        });
      }

      const updatedDeal = await this.dealRepository.save(deal);

      res.json({
        success: true,
        data: updatedDeal.toJSON(),
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      console.error(`[DealController.recordPayment] Failed to record ${req.body.type} payment for deal ${req.params.id}: ${error.message}`);

      if (error.message.includes('cannot') || error.message.includes('must')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to record payment',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/deals/:id
   * Delete a deal
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const deal = await this.dealRepository.findByIdWithRelations(id);

      if (!deal) {
        return res.status(404).json({ success: false, error: 'Deal not found' });
      }

      if (!this._canAccess(req.user, deal)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      await this.dealRepository.delete(id);

      res.json({ success: true, message: 'Deal deleted successfully' });
    } catch (error) {
      console.error(`[DealController.delete] Failed to delete deal ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to delete deal',
        message: error.message,
      });
    }
  }
}
