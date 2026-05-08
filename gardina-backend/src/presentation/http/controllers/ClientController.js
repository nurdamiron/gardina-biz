import { PostgresClientRepository } from '../../../infrastructure/repositories/PostgresClientRepository.js';

/**
 * Client Controller
 */
export class ClientController {
  constructor() {
    this.clientRepository = new PostgresClientRepository();
  }

  async getAll(req, res) {
    try {
      const filters = { role: req.user.role, userId: req.user.id };
      const result = await this.clientRepository.findAll(filters);
      res.json({ success: true, data: result.clients, total: result.total });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const client = await this.clientRepository.findById(req.params.id);
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      res.json({ success: true, data: client });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { phone } = req.body;

      // Check if client with this phone already exists
      if (phone) {
        const existingClient = await this.clientRepository.findByPhone(phone);
        if (existingClient) {
          return res.status(400).json({
            success: false,
            error: 'Бұл телефон нөмірімен клиент базада бар',
            existingClient: {
              id: existingClient.id,
              name: existingClient.name,
              phone: existingClient.phone
            }
          });
        }
      }

      const client = await this.clientRepository.create({ ...req.body, createdBy: req.user.id });
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { phone } = req.body;

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      // Check if phone is being changed and if it's already taken by another client
      if (phone && phone !== existingClient.phone) {
        const clientWithPhone = await this.clientRepository.findByPhone(phone);
        if (clientWithPhone && clientWithPhone.id !== id) {
          return res.status(400).json({
            success: false,
            error: 'Бұл телефон нөмірі басқа клиент үшін пайдаланылады'
          });
        }
      }

      const updatedClient = await this.clientRepository.update(id, req.body);
      res.json({ success: true, data: updatedClient });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if client exists
      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }

      const deleted = await this.clientRepository.delete(id);
      if (deleted) {
        res.json({ success: true, message: 'Client deleted successfully' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete client' });
      }
    } catch (error) {
      // If FK constraint violation (client has associated records)
      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          error: 'Клиентті жою мүмкін емес, себебі оның өлшемдері, ұсыныстары немесе тапсырыстары бар'
        });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
