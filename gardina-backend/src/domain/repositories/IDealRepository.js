/**
 * IDealRepository Interface
 * Repository contract for Deal aggregate
 */
export class IDealRepository {
  /**
   * Save deal (create or update)
   * @param {Deal} deal
   * @returns {Promise<Deal>}
   */
  async save(deal) {
    throw new Error('Method not implemented');
  }

  /**
   * Find deal by ID
   * @param {string} id
   * @returns {Promise<Deal|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all deals
   * @param {Object} filters
   * @param {Object} pagination
   * @returns {Promise<{deals: Deal[], total: number}>}
   */
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Find deals by client ID
   * @param {string} clientId
   * @returns {Promise<Deal[]>}
   */
  async findByClientId(clientId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find deals by designer ID
   * @param {string} designerId
   * @returns {Promise<Deal[]>}
   */
  async findByDesignerId(designerId) {
    throw new Error('Method not implemented');
  }

  /**
   * Find deals by status
   * @param {string} status
   * @returns {Promise<Deal[]>}
   */
  async findByStatus(status) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete deal
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if deal exists
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    throw new Error('Method not implemented');
  }
}
