import pool from '../database/config.js';
import { getTenantId } from '../tenant/tenantContext.js';
import { Measurement } from '../../domain/aggregates/Measurement.js';
import { Dimensions } from '../../domain/value-objects/Dimensions.js';

/**
 * PostgreSQL Measurement Repository
 */
export class PostgresMeasurementRepository {
  async save(measurement, opts = {}) {
    const client = await pool.connect();
    const tid = getTenantId();
    try {
      await client.query('BEGIN');

      // Save measurement
      const measurementResult = await client.query(
        `INSERT INTO measurements (
          id, organization_id, client_id, designer_id, status, scheduled_at, started_at, completed_at,
          address, room_type, budget_min, budget_max, deadline, client_reaction, notes, map_link,
          priority, styles, curtain_types, technical_features, delivery_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id) DO UPDATE SET
          status = $5, started_at = $7, completed_at = $8,
          budget_min = $11, budget_max = $12, client_reaction = $14, notes = $15, map_link = $16,
          priority = $17, styles = $18, curtain_types = $19, technical_features = $20,
          delivery_cost = $21,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          measurement.id,
          tid,
          measurement.clientId,
          measurement.designerId,
          measurement.status,
          measurement.scheduledAt,
          measurement.startedAt,
          measurement.completedAt,
          measurement.address,
          measurement.roomType,
          measurement.budgetMin,
          measurement.budgetMax,
          measurement.deadline,
          measurement.clientReaction,
          measurement.notes,
          measurement.mapLink,
          measurement.priority,
          measurement.styles,
          measurement.curtainTypes,

          JSON.stringify(measurement.technicalFeatures),
          measurement.deliveryCost,
        ]
      );

      // Delete windows that are no longer in the measurement (for proper sync)
      const currentWindowIds = measurement.windows.map(w => w.id);
      if (currentWindowIds.length > 0) {
        await client.query(
          `DELETE FROM measurement_windows mw
           USING measurements m
           WHERE mw.measurement_id = m.id AND m.organization_id = $2
             AND mw.measurement_id = $1 AND mw.id NOT IN (${currentWindowIds.map((_, i) => `$${i + 3}`).join(',')})`,
          [measurement.id, tid, ...currentWindowIds]
        );
      } else {
        await client.query(
          `DELETE FROM measurement_windows mw
           USING measurements m
           WHERE mw.measurement_id = m.id AND m.organization_id = $2 AND mw.measurement_id = $1`,
          [measurement.id, tid]
        );
      }

      // Save windows
      for (const window of measurement.windows) {
        await client.query(
          `INSERT INTO measurement_windows (
            id, measurement_id, window_number, room_name,
            width_left, width_center, width_right,
            height_left, height_center, height_right,
            mounting_type, top_offset, sill_height, obstacles, notes,
            fabric_code, fabric_brand, price_breakdown, design_photos
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (id) DO UPDATE SET
            width_left = $5, width_center = $6, width_right = $7,
            height_left = $8, height_center = $9, height_right = $10,
            mounting_type = $11, top_offset = $12, sill_height = $13,
            obstacles = $14, notes = $15,
            fabric_code = $16, fabric_brand = $17, price_breakdown = $18, design_photos = $19`,
          [
            window.id,
            measurement.id,
            window.windowNumber,
            window.roomName,
            window.dimensions.widthLeft,
            window.dimensions.widthCenter,
            window.dimensions.widthRight,
            window.dimensions.heightLeft,
            window.dimensions.heightCenter,
            window.dimensions.heightRight,
            window.mountingType,
            window.topOffset,
            window.sillHeight,
            window.obstacles,
            window.notes,
            window.fabricCode,
            window.fabricBrand,
            JSON.stringify(window.priceBreakdown),
            JSON.stringify(window.designPhotos),
          ]
        );
      }


      // Save photos
      for (const photo of measurement.photos) {
        await client.query(
          `INSERT INTO photos (id, organization_id, measurement_id, photo_type, url, thumbnail_url, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [photo.id, tid, measurement.id, photo.type, photo.url, photo.thumbnailUrl, photo.description]
        );
      }

      // =========================================================================================
      // SYNC LEGACY TABLES (rooms, room_items) FOR COMPATIBILITY WITH DEAL & INVENTORY SYSTEM
      // =========================================================================================
      
      await client.query(
        `DELETE FROM rooms r
         USING measurements m
         WHERE r.measurement_id = m.id AND m.organization_id = $2 AND r.measurement_id = $1`,
        [measurement.id, tid]
      );

      // 2. Re-create rooms and items from windows
      for (const window of measurement.windows) {
        // Create Room (using window ID if possible, or new UUID)
        // We use window.id as room.id to keep 1:1 mapping simpler
        await client.query(
          `INSERT INTO rooms (id, measurement_id, name, order_number)
           VALUES ($1, $2, $3, $4)`,
          [window.id, measurement.id, window.roomName || `Window ${window.windowNumber}`, window.windowNumber]
        );

        // Extract items from priceBreakdown.fabricItems
        const fabricItems = window.priceBreakdown?.fabricItems || [];
        
        for (const item of fabricItems) {
           if (item.fabricId) {
             await client.query(
               `INSERT INTO room_items (
                 room_id, fabric_id, variant_id, quantity
               ) VALUES ($1, $2, $3, $4)`,
               [
                 window.id, 
                 item.fabricId, 
                 item.variantId || null, 
                 parseFloat(item.quantity) || 0
               ]
             );
           }
        }
      }
      // =========================================================================================

      // Create the linked "lead" deal in the SAME transaction so a new order is
      // atomic: the measurement is never persisted without its deal, and the deal
      // is never orphaned. Idempotent — skips if this client+designer already has
      // a deal (mirrors the old client-side guard, but race-free). Only the create
      // flow opts in; updates never create deals.
      if (opts.createLeadDeal) {
        await client.query(
          `INSERT INTO deals (organization_id, client_id, designer_id, measurement_id)
           SELECT $1, $2, $3, $4
           WHERE NOT EXISTS (
             SELECT 1 FROM deals
             WHERE organization_id = $1 AND client_id = $2 AND designer_id = $3
           )`,
          [tid, measurement.clientId, measurement.designerId, measurement.id]
        );
      }

      // Reload saved windows so the returned domain object is accurate
      const savedWindowsResult = await client.query(
        `SELECT mw.* FROM measurement_windows mw
         JOIN measurements m ON m.id = mw.measurement_id AND m.organization_id = $2
         WHERE mw.measurement_id = $1 ORDER BY mw.window_number`,
        [measurement.id, tid]
      );
      const savedPhotosResult = await client.query(
        'SELECT * FROM photos WHERE measurement_id = $1 AND organization_id = $2',
        [measurement.id, tid]
      );

      await client.query('COMMIT');
      return this._mapToDomain(
        measurementResult.rows[0],
        savedWindowsResult.rows,
        savedPhotosResult.rows,
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT
        m.*,
        c.name as client_name,
        c.phone as client_phone,
        c.whatsapp as client_whatsapp,
        c.email as client_email,
        c.created_by as client_created_by
      FROM measurements m
      LEFT JOIN clients c ON m.client_id = c.id
      WHERE m.id = $1 AND m.organization_id = $2`,
      [id, tid]
    );

    if (result.rows.length === 0) return null;

    // Load windows
    const windowsResult = await pool.query(
      `SELECT mw.* FROM measurement_windows mw
       JOIN measurements m ON m.id = mw.measurement_id AND m.organization_id = $2
       WHERE mw.measurement_id = $1 ORDER BY mw.window_number`,
      [id, tid]
    );

    // Load photos
    const photosResult = await pool.query(
      'SELECT * FROM photos WHERE measurement_id = $1 AND organization_id = $2',
      [id, tid]
    );

    const measurement = this._mapToDomain(result.rows[0], windowsResult.rows, photosResult.rows);

    return {
      ...measurement.toJSON(),
      clientName: result.rows[0].client_name,
      clientPhone: result.rows[0].client_phone,
      clientWhatsapp: result.rows[0].client_whatsapp,
      clientEmail: result.rows[0].client_email,
      clientCreatedBy: result.rows[0].client_created_by,
    };
  }

  async findEntityById(id) {
    const tid = getTenantId();
    const result = await pool.query(
      `SELECT * FROM measurements WHERE id = $1 AND organization_id = $2`,
      [id, tid]
    );

    if (result.rows.length === 0) return null;

    // Load windows
    const windowsResult = await pool.query(
      `SELECT mw.* FROM measurement_windows mw
       JOIN measurements m ON m.id = mw.measurement_id AND m.organization_id = $2
       WHERE mw.measurement_id = $1 ORDER BY mw.window_number`,
      [id, tid]
    );

    // Load photos
    const photosResult = await pool.query(
      'SELECT * FROM photos WHERE measurement_id = $1 AND organization_id = $2',
      [id, tid]
    );

    return this._mapToDomain(result.rows[0], windowsResult.rows, photosResult.rows);
  }

  async findAll(filters = {}, pagination = { offset: 0, limit: 50 }) {
    const tid = getTenantId();
    const conditions = ['m.organization_id = $1'];
    const params = [tid];
    let paramIndex = 2;

    if (filters.designerId) {
      conditions.push(`m.designer_id = $${paramIndex}`);
      params.push(filters.designerId);
      paramIndex++;
    }

    if (filters.managerId) {
      conditions.push(`c.created_by = $${paramIndex}`);
      params.push(filters.managerId);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`m.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.clientId) {
      conditions.push(`m.client_id = $${paramIndex}`);
      params.push(filters.clientId);
      paramIndex++;
    }

    const where = conditions.join(' AND ');

    // Single query with JSON aggregation — eliminates N+1 (was 2 extra queries per row)
    const dataQuery = `
      SELECT
        m.*,
        c.name       AS client_name,
        c.phone      AS client_phone,
        c.whatsapp   AS client_whatsapp,
        c.email      AS client_email,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', mw.id,
              'window_number', mw.window_number,
              'room_name', mw.room_name,
              'width_left', mw.width_left,
              'width_center', mw.width_center,
              'width_right', mw.width_right,
              'height_left', mw.height_left,
              'height_center', mw.height_center,
              'height_right', mw.height_right,
              'mounting_type', mw.mounting_type,
              'top_offset', mw.top_offset,
              'sill_height', mw.sill_height,
              'obstacles', mw.obstacles,
              'notes', mw.notes,
              'fabric_code', mw.fabric_code,
              'fabric_brand', mw.fabric_brand,
              'price_breakdown', mw.price_breakdown,
              'design_photos', mw.design_photos
            )
          ) FILTER (WHERE mw.id IS NOT NULL),
          '[]'
        ) AS windows,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ph.id,
              'photo_type', ph.photo_type,
              'url', ph.url,
              'thumbnail_url', ph.thumbnail_url,
              'description', ph.description
            )
          ) FILTER (WHERE ph.id IS NOT NULL),
          '[]'
        ) AS photos
      FROM measurements m
      LEFT JOIN clients c ON m.client_id = c.id
      LEFT JOIN measurement_windows mw ON mw.measurement_id = m.id
      LEFT JOIN photos ph ON ph.measurement_id = m.id AND ph.organization_id = m.organization_id
      WHERE ${where}
      GROUP BY m.id, c.name, c.phone, c.whatsapp, c.email
      ORDER BY m.scheduled_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Accurate total count with the same filters
    const countQuery = `
      SELECT COUNT(DISTINCT m.id) AS total
      FROM measurements m
      LEFT JOIN clients c ON m.client_id = c.id
      WHERE ${where}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(dataQuery, [...params, pagination.limit, pagination.offset]),
      pool.query(countQuery, params),
    ]);

    return {
      measurements: result.rows.map(row => {
        const measurement = this._mapToDomain(row, row.windows || [], row.photos || []);
        return {
          ...measurement.toJSON(),
          clientName: row.client_name,
          clientPhone: row.client_phone,
          clientWhatsapp: row.client_whatsapp,
          clientEmail: row.client_email,
        };
      }),
      total: parseInt(countResult.rows[0].total),
    };
  }

  /**
   * Link measurement to a deal (bidirectional)
   * Updates both measurement.deal_id and deal.measurement_id
   * @param {string} measurementId
   * @param {string} dealId
   */
  async linkToDeal(measurementId, dealId) {
    const client = await pool.connect();
    const tid = getTenantId();
    try {
      await client.query('BEGIN');

      // Update measurement to reference deal
      await client.query(
        'UPDATE measurements SET deal_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3',
        [dealId, measurementId, tid]
      );

      // Update deal to reference measurement
      await client.query(
        'UPDATE deals SET measurement_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3',
        [measurementId, dealId, tid]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async exists(id) {
    const tid = getTenantId();
    const result = await pool.query(
      'SELECT 1 FROM measurements WHERE id = $1 AND organization_id = $2',
      [id, tid]
    );
    return result.rows.length > 0;
  }

  _mapToDomain(row, windows = [], photos = []) {
    return new Measurement({
      id: row.id,
      clientId: row.client_id,
      designerId: row.designer_id,
      status: row.status,
      scheduledAt: row.scheduled_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      address: row.address,
      roomType: row.room_type,
      budgetMin: row.budget_min,
      budgetMax: row.budget_max,
      deadline: row.deadline,
      clientReaction: row.client_reaction,
      notes: row.notes,
      mapLink: row.map_link,
      priority: row.priority,
      styles: row.styles,
      curtainTypes: row.curtain_types,
      technicalFeatures: row.technical_features || [],
      windows: windows.map(w => ({
        id: w.id,
        windowNumber: w.window_number,
        roomName: w.room_name,
        dimensions: new Dimensions({
          widthLeft: w.width_left,
          widthCenter: w.width_center,
          widthRight: w.width_right,
          heightLeft: w.height_left,
          heightCenter: w.height_center,
          heightRight: w.height_right,
        }),
        mountingType: w.mounting_type,
        topOffset: w.top_offset,
        sillHeight: w.sill_height,
        obstacles: w.obstacles || [],
        notes: w.notes,
        fabricCode: w.fabric_code,
        fabricBrand: w.fabric_brand,
        priceBreakdown: w.price_breakdown || [],
        designPhotos: w.design_photos || [],
      })),
      photos: photos.map(p => ({
        id: p.id,
        type: p.photo_type,
        url: p.url,
        thumbnailUrl: p.thumbnail_url,
        description: p.description,
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
