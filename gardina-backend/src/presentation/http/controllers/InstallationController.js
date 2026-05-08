import { PostgresInstallationRepository } from '../../../infrastructure/repositories/PostgresInstallationRepository.js';

export class InstallationController {
  constructor() {
    this.installationRepository = new PostgresInstallationRepository();
  }

  getAll = async (req, res) => {
    try {
      const { limit, offset, installerId, status, dealId, date } = req.query;
      const result = await this.installationRepository.findAll({ 
        installerId, status, dealId, date 
      }, {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0
      });
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('InstallationController.getAll error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const installation = await this.installationRepository.findById(id);
      if (!installation) return res.status(404).json({ success: false, error: 'Installation not found' });
      res.json({ success: true, data: installation });
    } catch (error) {
        console.error('InstallationController.getById error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  create = async (req, res) => {
    try {
        const data = req.body;
        const installation = await this.installationRepository.create(data);
        res.status(201).json({ success: true, data: installation });
    } catch(error) {
        console.error('InstallationController.create error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
  }

  update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const installation = await this.installationRepository.update(id, data);
        if (!installation) return res.status(404).json({ success: false, error: 'Installation not found' });
        res.json({ success: true, data: installation });
    } catch(error) {
        console.error('InstallationController.update error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
  }

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const success = await this.installationRepository.delete(id);
      if (!success) return res.status(404).json({ success: false, error: 'Installation not found' });
      res.json({ success: true, message: 'Installation deleted' });
    } catch (error) {
        console.error('InstallationController.delete error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
