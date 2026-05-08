import pool from '../database/config.js';

export class PostgresOrganizationRepository {
  async findBySlug(slug) {
    const result = await pool.query(
      'SELECT id, name, slug, created_at, updated_at FROM organizations WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  async create({ name, slug }) {
    const result = await pool.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2)
       RETURNING id, name, slug, created_at, updated_at`,
      [name, slug]
    );
    return result.rows[0];
  }
}
