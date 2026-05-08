import { PostgresPaymentRepository } from '../../../infrastructure/repositories/PostgresPaymentRepository.js';

export class PaymentController {
  constructor() {
    this.paymentRepository = new PostgresPaymentRepository();
  }

  getAll = async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type,
        measurementId: req.query.measurementId,
        dealId: req.query.dealId,
        orderId: req.query.orderId
      };

      // Non-admin users only see payments they created
      if (req.user.role !== 'admin') {
        filters.createdBy = req.user.id;
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;

      const result = await this.paymentRepository.findAll(filters, { limit, offset });
      res.json({
        success: true,
        data: result.data,
        total: result.total
      });
    } catch (error) {
      console.error('PaymentController.getAll error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  create = async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        createdBy: req.user.id
      };
      
      const payment = await this.paymentRepository.addPayment(paymentData);
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('PaymentController.create error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  delete = async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await this.paymentRepository.findById(id);
      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      if (req.user.role !== 'admin' && payment.created_by !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      await this.paymentRepository.delete(id);
      res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
       console.error('PaymentController.delete error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
