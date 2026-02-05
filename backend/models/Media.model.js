import pool from "../utils/db.js";


export default class Media {
  static async create(mediaData) {
    const {
      title, description, type, url, publicId, thumbnail, category,
      project, uploadedBy, isApproved, tags, metadata
    } = mediaData;

    try {
      const result = await pool.query(
        `INSERT INTO media (
          title, description, type, url, public_id, thumbnail, category,
          project_id, uploaded_by, is_approved, tags, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          title || null, description || null, type, url, publicId,
          thumbnail || null, category || 'gallery', project || null,
          uploadedBy, isApproved || false, tags || [], JSON.stringify(metadata || {})
        ]
      );

      return this.mapRowToMedia(result.rows[0]);
    } catch (error) {
      console.error('Media.create error:', error.message);
      if (error.code === '42P01') { // Table does not exist
        throw new Error('Database table does not exist. Please restart the server to initialize tables.');
      }
      throw error;
    }
  }

  static async find(query = {}) {
    let queryStr = `
      SELECT m.*,
             json_build_object('id', p.id, 'title', p.title) as project,
             json_build_object('id', u.id, 'name', u.name) as uploadedBy
      FROM media m
      LEFT JOIN projects p ON m.project_id = p.id
      LEFT JOIN users u ON m.uploaded_by = u.id
    `;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (query.category) {
      conditions.push(`m.category = $${paramCount++}`);
      values.push(query.category);
    }
    if (query.project) {
      conditions.push(`m.project_id = $${paramCount++}`);
      values.push(query.project);
    }
    if (query.approved === 'true') {
      conditions.push(`m.is_approved = $${paramCount++}`);
      values.push(true);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY m.created_at DESC';

    try {
      const result = await pool.query(queryStr, values);
      return result.rows.map(row => this.mapRowToMedia(row)).filter(m => m !== null);
    } catch (error) {
      console.error('Media.find error:', error.message);
      if (error.code === '42P01') { // Table does not exist
        return [];
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        throw error;
      }
      return [];
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT m.*,
                json_build_object('id', p.id, 'title', p.title, 'description', p.description) as project,
                json_build_object('id', u.id, 'name', u.name) as uploadedBy
         FROM media m
         LEFT JOIN projects p ON m.project_id = p.id
         LEFT JOIN users u ON m.uploaded_by = u.id
         WHERE m.id = $1`,
        [id]
      );

      return result.rows[0] ? this.mapRowToMedia(result.rows[0]) : null;
    } catch (error) {
      console.error('Media.findById error:', error.message);
      if (error.code === '42P01') { // Table does not exist
        return null;
      }
      throw error;
    }
  }

  static async findByIdAndUpdate(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key === 'metadata') {
        fields.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(updates[key]));
      } else {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query(
      `UPDATE media SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapRowToMedia(result.rows[0]) : null;
  }

  static async findByIdAndDelete(id) {
    const result = await pool.query('DELETE FROM media WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] ? this.mapRowToMedia(result.rows[0]) : null;
  }

  static mapRowToMedia(row) {
    return {
      _id: row.id,
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      url: row.url,
      publicId: row.public_id,
      thumbnail: row.thumbnail,
      category: row.category,
      project: typeof row.project === 'string' ? JSON.parse(row.project) : row.project,
      uploadedBy: typeof row.uploaded_by === 'object' ? row.uploaded_by : 
                  typeof row.uploaded_by === 'string' ? JSON.parse(row.uploaded_by) : row.uploaded_by,
      isApproved: row.is_approved,
      tags: row.tags || [],
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
