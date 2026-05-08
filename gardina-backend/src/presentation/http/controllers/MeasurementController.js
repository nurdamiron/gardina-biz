import { PostgresMeasurementRepository } from '../../../infrastructure/repositories/PostgresMeasurementRepository.js';
import { Measurement } from '../../../domain/aggregates/Measurement.js';
import NotificationService from '../../../domain/services/NotificationService.js';
import pool from '../../../infrastructure/database/config.js';
import { getTenantId } from '../../../infrastructure/tenant/tenantContext.js';

/**
 * Measurement Controller
 */
export class MeasurementController {
  constructor() {
    this.measurementRepository = new PostgresMeasurementRepository();
    this.paymentRepository = null;
    import('../../../infrastructure/repositories/PostgresPaymentRepository.js')
      .then(({ PostgresPaymentRepository }) => {
        this.paymentRepository = new PostgresPaymentRepository();
      })
      .catch((err) => {
        // payments table may not exist in this environment — log so it's visible
        console.error('[MeasurementController] PaymentRepository failed to load:', err.message);
        this.paymentRepository = null;
      });
  }

  // Returns true if user can access this measurement
  _canAccess(user, measurement) {
    if (user.role === 'admin') return true;
    if (user.role === 'designer') return measurement.designerId === user.id;
    if (user.role === 'manager' || user.role === 'sales') {
      return measurement.clientCreatedBy === user.id;
    }
    return false;
  }

  async getAll(req, res) {
    try {
      const { designerId, clientId, status, page = 1, limit = 50 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;

      // Role-based access control
      if (req.user.role === 'designer') {
        filters.designerId = req.user.id;
      } else if (req.user.role === 'manager' || req.user.role === 'sales') {
        // Видят только замеры по своим клиентам
        filters.managerId = req.user.id;
      } else if (designerId) {
        // Админ может фильтровать по дизайнеру
        filters.designerId = designerId;
      }

      const result = await this.measurementRepository.findAll(filters, {
        offset: (page - 1) * limit,
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: result.measurements,
        total: result.total,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const measurement = await this.measurementRepository.findById(req.params.id);
      if (!measurement) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }

      if (!this._canAccess(req.user, measurement)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      // Payments (optional)
      let payments = [];
      if (this.paymentRepository) {
        try {
          payments = await this.paymentRepository.findByMeasurement(req.params.id);
        } catch (err) {
          payments = [];
        }
      }

      res.json({ success: true, data: { ...measurement, payments } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const {
        clientId, designerId, address, scheduledAt, roomType,
        budgetMin, budgetMax, deadline, notes, mapLink,
        priority, styles, curtainTypes, technicalFeatures
      } = req.body;

      // Validate required fields
      if (!clientId) {
        return res.status(400).json({ success: false, error: 'clientId is required' });
      }
      if (!designerId) {
        return res.status(400).json({ success: false, error: 'designerId is required' });
      }
      if (!address) {
        return res.status(400).json({ success: false, error: 'address is required' });
      }

      const measurement = Measurement.create({
        clientId,
        designerId,
        address,
        scheduledAt,
      });

      measurement.updateMetadata({ roomType, deadline, notes, mapLink, priority, styles, curtainTypes, technicalFeatures });
      if (budgetMin && budgetMax) measurement.updateBudget(budgetMin, budgetMax);
      if (req.body.deliveryCost) measurement.setDeliveryCost(req.body.deliveryCost);

      const saved = await this.measurementRepository.save(measurement);

      // Send notification to assigned designer
      try {
        // Get client name
        const tid = getTenantId();
        const clientResult = await pool.query(
          'SELECT name FROM clients WHERE id = $1 AND organization_id = $2',
          [clientId, tid]
        );
        const clientName = clientResult.rows[0]?.name || 'Клиент';

        await NotificationService.notifyTaskAssigned(
          saved.id,
          designerId,
          clientName,
          address
        );
      } catch (notifyError) {
        console.error('Failed to send task assignment notification:', notifyError.message);
      }

      res.status(201).json({
        success: true,
        data: saved.toJSON(),
        message: 'Measurement created successfully',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { windows, settings, notes } = req.body;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      // Update notes if provided
      if (notes) {
        measurement.addNotes(notes);
      }

      // Clear existing windows and add new ones
      if (windows && Array.isArray(windows)) {
        // Remove all existing windows
        const existingWindowIds = measurement.windows.map(w => w.id);
        for (const windowId of existingWindowIds) {
          try {
            measurement.removeWindow(windowId);
          } catch (e) {
            // Ignore errors when removing windows
          }
        }

        // Add new windows
        for (const windowData of windows) {
          measurement.addWindow({
            id: windowData.id,
            roomName: windowData.roomName,
            dimensions: windowData.dimensions || { width: 0, height: 0 },
            solutionType: windowData.solutionType,
            notes: windowData.notes,
            designPhotos: windowData.designPhotos || [],
            // Все данные комнаты сохраняем в priceBreakdown как JSON
            priceBreakdown: {
              fabricItems: windowData.fabricItems?.map(item => ({
                ...item,
                variantId: item.variant?.id || item.variantId,
              })) || [],
              sewingRate: windowData.sewingRate,
              cornice: windowData.cornice || {},
              tape: windowData.tape || {},
              hooks: windowData.hooks || {},
              extras: windowData.extras || [],
              installationRate: windowData.installationRate,
              installation: windowData.installation || {},
              // Для жалюзи/зебра
              material: windowData.material,
              slat: windowData.slat,
              system: windowData.system,
              color: windowData.color,
              mechanism: windowData.mechanism,
              fabric: windowData.fabric,
              sewing: windowData.sewing,
              quantity: windowData.quantity,
            },
          });
        }
      }

      // Update delivery cost from settings
      if (settings?.delivery !== undefined) {
        measurement.setDeliveryCost(settings.delivery);
      }

      const saved = await this.measurementRepository.save(measurement);

      res.json({ 
        success: true, 
        data: saved.toJSON(), 
        message: 'Measurement updated successfully' 
      });
    } catch (error) {
      console.error('[MeasurementController.update] Error:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async addWindow(req, res) {
    try {
      const { id } = req.params;
      const windowData = req.body;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      measurement.addWindow(windowData);
      const saved = await this.measurementRepository.save(measurement);

      res.json({ success: true, data: saved.toJSON() });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getWindow(req, res) {
    try {
      const { id, windowId } = req.params;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      const window = measurement.getWindow(windowId);
      if (!window) {
        return res.status(404).json({ success: false, error: 'Window not found' });
      }

      res.json({ success: true, data: window });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateWindow(req, res) {
    try {
      const { id, windowId } = req.params;
      const windowData = req.body;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      measurement.updateWindow(windowId, windowData);
      const saved = await this.measurementRepository.save(measurement);

      res.json({ success: true, data: saved.toJSON(), message: 'Window updated successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async removeWindow(req, res) {
    try {
      const { id, windowId } = req.params;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      measurement.removeWindow(windowId);
      const saved = await this.measurementRepository.save(measurement);

      res.json({ success: true, data: saved.toJSON(), message: 'Window removed successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async addPhoto(req, res) {
    try {
      const { id } = req.params;
      const photoData = req.body;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      measurement.addPhoto(photoData);
      const saved = await this.measurementRepository.save(measurement);

      res.json({ success: true, data: saved.toJSON() });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async complete(req, res) {
    try {
      const { id } = req.params;
      const { clientReaction, notes } = req.body;

      const measurementCheck = await this.measurementRepository.findById(id);
      if (!measurementCheck) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }
      if (!this._canAccess(req.user, measurementCheck)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const measurement = await this.measurementRepository.findEntityById(id);

      if (clientReaction) measurement.setClientReaction(clientReaction);
      if (notes) measurement.addNotes(notes);

      measurement.complete();
      const saved = await this.measurementRepository.save(measurement);

      res.json({ success: true, data: saved.toJSON(), message: 'Measurement completed' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/measurements/:id/payments
   * Add payment to measurement
   */
  async addPayment(req, res) {
    if (!this.paymentRepository) {
      return res.status(500).json({ success: false, error: 'Payments repository not available' });
    }
    try {
      const { id } = req.params;
      const { type = 'prepayment', amount, note, paidAt } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ success: false, error: 'Amount is required' });
      }

      const measurement = await this.measurementRepository.findById(id);
      if (!measurement) {
        return res.status(404).json({ success: false, error: 'Measurement not found' });
      }

      if (!this._canAccess(req.user, measurement)) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const payment = await this.paymentRepository.addPayment({
        measurementId: id,
        type,
        amount: parseInt(amount, 10),
        note,
        paidAt,
        createdBy: req.user?.id || null,
      });

      return res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment added',
      });
    } catch (error) {
      console.error(`[MeasurementController.addPayment] Failed: ${error.message}`);
      res.status(500).json({ success: false, error: 'Failed to add payment', message: error.message });
    }
  }
}
