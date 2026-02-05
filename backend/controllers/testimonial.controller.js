import pool from '../utils/db.js';

/**
 * Get approved testimonials (public)
 */
export const getTestimonials = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, role, location, message, status, created_at
       FROM testimonials
       WHERE status = 'approved'
       ORDER BY created_at DESC`
    );

    const testimonials = rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      location: row.location,
      message: row.message,
      status: row.status,
      createdAt: row.created_at
    }));

    res.json({ success: true, testimonials });
  } catch (error) {
    console.error('Get testimonials error:', error);
    next(error);
  }
};

/**
 * Get all testimonials (admin)
 */
export const getAllTestimonials = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT id, name, role, location, message, status, submitted_by, created_at, updated_at
      FROM testimonials
    `;
    const params = [];

    if (status) {
      query += ` WHERE status = $1`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, params);

    const testimonials = rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      location: row.location,
      message: row.message,
      status: row.status,
      submittedBy: row.submitted_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, testimonials });
  } catch (error) {
    console.error('Get all testimonials error:', error);
    next(error);
  }
};

/**
 * Create testimonial (public - user submission)
 */
export const createTestimonial = async (req, res, next) => {
  try {
    const { name, role, location, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    const submittedBy = req.user?.id || null;

    const { rows } = await pool.query(
      `INSERT INTO testimonials (name, role, location, message, status, submitted_by)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, name, role, location, message, status, created_at`,
      [name, role || null, location || null, message, submittedBy]
    );

    const testimonial = {
      id: rows[0].id,
      name: rows[0].name,
      role: rows[0].role,
      location: rows[0].location,
      message: rows[0].message,
      status: rows[0].status,
      createdAt: rows[0].created_at
    };

    res.status(201).json({ success: true, testimonial, message: 'Testimonial submitted successfully. It will appear once approved.' });
  } catch (error) {
    console.error('Create testimonial error:', error);
    next(error);
  }
};

/**
 * Update testimonial status (admin)
 */
export const updateTestimonialStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { rows } = await pool.query(
      `UPDATE testimonials
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, role, location, message, status, created_at, updated_at`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    const testimonial = {
      id: rows[0].id,
      name: rows[0].name,
      role: rows[0].role,
      location: rows[0].location,
      message: rows[0].message,
      status: rows[0].status,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at
    };

    res.json({ success: true, testimonial });
  } catch (error) {
    console.error('Update testimonial status error:', error);
    next(error);
  }
};

/**
 * Delete testimonial (admin)
 */
export const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({ success: true, message: 'Testimonial deleted successfully' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    next(error);
  }
};
