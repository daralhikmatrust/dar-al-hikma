import pool from '../utils/db.js';

export default class Project {
  static async find(query = {}) {
    let queryStr = 'SELECT * FROM projects';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (query.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(query.status);
    }
    if (query.faculty) {
      conditions.push(`faculty = $${paramCount++}`);
      values.push(query.faculty);
    }
    if (query.isFeatured !== undefined) {
      conditions.push(`is_featured = $${paramCount++}`);
      values.push(query.isFeatured === true || query.isFeatured === 'true');
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY created_at DESC';

    if (query.limit) {
      queryStr += ` LIMIT $${paramCount++}`;
      values.push(parseInt(query.limit));
    }

    try {
      const result = await pool.query(queryStr, values);
      return result.rows.map(row => this.mapRowToProject(row)).filter(p => p !== null);
    } catch (error) {
      console.error('Project.find error:', error.message);
      // If table doesn't exist, return empty array
      if (error.message && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
      return result.rows[0] ? this.mapRowToProject(result.rows[0]) : null;
    } catch (error) {
      console.error('Project.findById error:', error.message);
      if (error.message && error.message.includes('does not exist')) {
        return null;
      }
      throw error;
    }
  }

  static async create(projectData) {
    const {
      title, description, shortDescription, faculty, status, location,
      targetAmount, currentAmount, progress, startDate, createdBy, isFeatured, tags, milestones, images
    } = projectData;

    const result = await pool.query(
      `INSERT INTO projects (
        title, description, short_description, faculty, status, location,
        target_amount, current_amount, progress, start_date, created_by, is_featured, tags, milestones, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        title, description, shortDescription || null, faculty, status || 'ongoing',
        JSON.stringify(location || {}), 
        targetAmount ? parseFloat(targetAmount) : null, 
        currentAmount ? parseFloat(currentAmount) : 0,
        progress ? parseInt(progress) : 0,
        startDate || new Date(),
        createdBy, isFeatured || false, 
        tags ? JSON.stringify(tags) : '[]', 
        milestones ? JSON.stringify(milestones) : '[]',
        images ? JSON.stringify(images) : '[]'
      ]
    );

    return this.mapRowToProject(result.rows[0]);
  }

  static async findByIdAndUpdate(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key === 'location') {
        fields.push(`location = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(updates[key]));
      } else if (key === 'images' || key === 'videos' || key === 'milestones' || key === 'tags') {
        fields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount++}::jsonb`);
        values.push(JSON.stringify(updates[key]));
      } else if (key === 'targetAmount' || key === 'currentAmount') {
        fields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount++}`);
        values.push(updates[key] !== null && updates[key] !== undefined ? parseFloat(updates[key]) : null);
      } else if (key === 'progress') {
        fields.push(`progress = $${paramCount++}`);
        values.push(updates[key] !== null && updates[key] !== undefined ? parseInt(updates[key]) : 0);
      } else {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] ? this.mapRowToProject(result.rows[0]) : null;
  }

  static async findByIdAndDelete(id) {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] ? this.mapRowToProject(result.rows[0]) : null;
  }

  static mapRowToProject(row) {
    if (!row) return null;
    return {
      _id: row.id,
      id: row.id,
      title: row.title,
      description: row.description,
      shortDescription: row.short_description,
      faculty: row.faculty,
      status: row.status,
      location: typeof row.location === 'string' ? JSON.parse(row.location) : (row.location || {}),
      targetAmount: parseFloat(row.target_amount || 0),
      currentAmount: parseFloat(row.current_amount || 0),
      startDate: row.start_date,
      completionDate: row.completion_date,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []),
      videos: typeof row.videos === 'string' ? JSON.parse(row.videos) : (row.videos || []),
      progress: parseInt(row.progress || 0),
      milestones: typeof row.milestones === 'string' ? JSON.parse(row.milestones) : (row.milestones || []),
      isFeatured: row.is_featured || false,
      tags: row.tags || [],
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
