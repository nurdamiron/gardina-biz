import { PostgresDealRepository } from '../../../infrastructure/repositories/PostgresDealRepository.js';
import { PostgresClientRepository } from '../../../infrastructure/repositories/PostgresClientRepository.js';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import { PostgresDealEventsRepository } from '../../../infrastructure/repositories/PostgresDealEventsRepository.js';
import { CreateDealUseCase } from '../../../application/use-cases/CreateDealUseCase.js';
import NotificationService from '../../../domain/services/NotificationService.js';

/**
 * Order Controller
 * Handles HTTP requests for orders (formerly deals)
 */
export class OrderController {
  constructor() {
    // Using existing repositories (table is still 'deals' in DB)
    this.orderRepository = new PostgresDealRepository();
    this.clientRepository = new PostgresClientRepository();
    this.userRepository = new PostgresUserRepository();
    this.orderEventsRepository = new PostgresDealEventsRepository();
  }

  // Returns true if the requesting user is allowed to access this order
  _canAccess(user, order) {
    if (user.role === 'admin') return true;
    if (user.role === 'designer') return order.designerId === user.id;
    if (user.role === 'manager' || user.role === 'sales') {
      return order.client?.createdBy === user.id;
    }
    return false;
  }

  /**
   * GET /api/orders/funnel
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

      const stats = await this.orderRepository.getFunnelStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error(`[OrderController.getFunnel] Failed to fetch funnel stats: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch funnel stats',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/orders
   * Get all orders with filters
   */
  async getAll(req, res) {
    try {
      const { status, clientId, designerId, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;

      // Role-based access control
      if (req.user.role === 'designer') {
        filters.designerId = req.user.id;
      } else if (req.user.role === 'manager' || req.user.role === 'sales') {
        // Видят только заказы своих клиентов (client.created_by = user.id)
        filters.managerId = req.user.id;
      } else if (designerId) {
        // Админ может фильтровать по дизайнеру
        filters.designerId = designerId;
      }

      const pagination = {
        offset: (page - 1) * limit,
        limit: parseInt(limit),
      };

      const result = await this.orderRepository.findAll(filters, pagination);

      res.json({
        success: true,
        data: result.deals,
        pagination: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error(`[OrderController.getAll] Failed to fetch orders: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/orders/:id
   * Get order by ID with all relations and events
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const order = await this.orderRepository.findByIdWithRelations(id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (!this._canAccess(req.user, order)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      // Fetch order events
      const events = await this.orderEventsRepository.findByDealId(id);

      res.json({
        success: true,
        data: {
          ...order,
          events,
        },
      });
    } catch (error) {
      console.error(`[OrderController.getById] Failed to fetch order ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/orders
   * Create a new order
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

      // Use the CreateDealUseCase (reusing existing use case)
      const useCase = new CreateDealUseCase(
        this.orderRepository,
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
        message: 'Order created successfully',
      });
    } catch (error) {
      console.error(`[OrderController.create] Failed to create order for client ${req.body.clientId}: ${error.message}`);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create order',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/orders/:id/status
   * Change order status
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

      const orderWithRelations = await this.orderRepository.findByIdWithRelations(id);

      if (!orderWithRelations) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (!this._canAccess(req.user, orderWithRelations)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const order = await this.orderRepository.findById(id);

      // Call appropriate business method based on status
      switch (status) {
        case 'proposal_accepted':
          order.acceptProposal();
          break;
        case 'contract_signed':
          order.signContract();
          break;
        case 'in_production':
          order.startProduction();
          break;
        case 'ready_for_installation':
          order.markReadyForInstallation();
          break;
        case 'installation_scheduled':
          order.scheduleInstallation(data?.installationDate);
          break;
        case 'installed':
          order.markAsInstalled();
          break;
        case 'completed':
          order.complete();
          break;
        case 'cancelled':
          order.cancel(data?.reason);
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid status transition',
          });
      }

      const updatedOrder = await this.orderRepository.save(order);

      // Trigger Inventory Deduction if contract signed
      if (status === 'contract_signed') {
         try {
           const { InventoryService } = await import('../../../domain/services/InventoryService.js');
           await InventoryService.deductStockForDeal(order.id, req.user?.id);
         } catch (e) {
            console.error('Failed to deduct stock:', e);
         }
      }

      // Restore inventory if order is cancelled
      if (status === 'cancelled') {
         try {
           const { InventoryService } = await import('../../../domain/services/InventoryService.js');
           await InventoryService.restoreStockForDeal(order.id, req.user?.id);
         } catch (e) {
            console.error('Failed to restore stock:', e);
         }
      }

      // Send notification about status change
      try {
        const dealWithRelations = await this.orderRepository.findByIdWithRelations(id);
        if (dealWithRelations) {
          await NotificationService.notifyDealStatusChanged(
            id,
            order.status, // old status from before changeStatus
            status,       // new status
            dealWithRelations.designerId,
            null, // managerId - would need to fetch from client.created_by
            dealWithRelations.client?.name || 'Клиент'
          );
        }
      } catch (notifyError) {
        console.error('Failed to send status change notification:', notifyError.message);
        // Don't fail the request if notification fails
      }

      res.json({
        success: true,
        data: updatedOrder.toJSON(),
        message: 'Order status updated successfully',
      });
    } catch (error) {
      console.error(`[OrderController.updateStatus] Failed to update order ${req.params.id}: ${error.message}`);

      if (error.message.includes('Cannot')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /api/orders/:id/payment
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

      const orderWithRelations = await this.orderRepository.findByIdWithRelations(id);

      if (!orderWithRelations) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (!this._canAccess(req.user, orderWithRelations)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const order = await this.orderRepository.findById(id);

      if (type === 'prepayment') {
        order.recordPrepayment(amount);
      } else if (type === 'final') {
        order.recordFinalPayment(amount);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid payment type. Use "prepayment" or "final"',
        });
      }

      const updatedOrder = await this.orderRepository.save(order);

      // Send notification about payment
      try {
        const dealWithRelations = await this.orderRepository.findByIdWithRelations(id);
        if (dealWithRelations) {
          await NotificationService.notifyPaymentReceived(
            id,
            amount,
            dealWithRelations.designerId,
            null, // managerId
            dealWithRelations.client?.name || 'Клиент'
          );
        }
      } catch (notifyError) {
        console.error('Failed to send payment notification:', notifyError.message);
      }

      res.json({
        success: true,
        data: updatedOrder.toJSON(),
        message: 'Payment recorded successfully',
      });
    } catch (error) {
      console.error(`[OrderController.recordPayment] Failed to record payment: ${error.message}`);

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
   * DELETE /api/orders/:id
   * Delete an order
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const order = await this.orderRepository.findByIdWithRelations(id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (!this._canAccess(req.user, order)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      await this.orderRepository.delete(id);

      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      console.error(`[OrderController.delete] Failed to delete order ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to delete order',
        message: error.message,
      });
    }
  }
}

