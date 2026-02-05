import pool from '../utils/db.js';
import crypto from 'crypto';
import {
  getSupabaseAdmin,
  SUPABASE_MEDIA_BUCKET,
  getPublicObjectUrl,
  extractPublicObjectPathFromUrl
} from '../utils/supabase.js';

/**
 * Get Hall of Fame members (public)
 */
export const getHallOfFameMembers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, profession, photo, bio, total_donations, donation_count, created_at
       FROM hall_of_fame
       ORDER BY total_donations DESC, created_at DESC`
    );

    const members = rows.map(row => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      profession: row.profession,
      photo: row.photo,
      bio: row.bio,
      totalDonations: parseFloat(row.total_donations || 0),
      donationCount: parseInt(row.donation_count || 0),
      createdAt: row.created_at
    }));

    res.json({
      success: true,
      donors: members
    });
  } catch (error) {
    console.error('Get Hall of Fame error:', error);

    if (error.code === '42P01') {
      return res.json({ success: true, donors: [] });
    }

    next(error);
  }
};

/**
 * Get all Hall of Fame members (admin)
 */
export const getAllHallOfFame = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM hall_of_fame
       ORDER BY total_donations DESC, created_at DESC`
    );

    const members = rows.map(row => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      profession: row.profession,
      photo: row.photo,
      bio: row.bio,
      totalDonations: parseFloat(row.total_donations || 0),
      donationCount: parseInt(row.donation_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ success: true, members });
  } catch (error) {
    console.error('Get all Hall of Fame error:', error);

    if (error.code === '42P01') {
      return res.json({ success: true, members: [] });
    }

    next(error);
  }
};

/**
 * Create Hall of Fame member (admin)
 */
export const createHallOfFameMember = async (req, res, next) => {
  try {
    const { name, profession, bio } = req.body;
    let photoUrl = null;

    // Upload photo
    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const ext = (req.file.originalname || '')
          .toLowerCase()
          .split('.')
          .pop() || 'jpg';

        const id = crypto.randomUUID
          ? crypto.randomUUID()
          : crypto.randomBytes(16).toString('hex');

        const objectPath = `dar-al-hikma/hall-of-fame/${id}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (error) throw error;

        photoUrl = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
      } catch (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Photo upload failed'
        });
      }
    } else if (req.body.photoBase64) {
      photoUrl = req.body.photoBase64;
    }

    // Donation stats
    let totalDonations = 0;
    let donationCount = 0;

    const { rows: userRows } = await pool.query(
      `SELECT id FROM users WHERE name = $1 OR email = $1 LIMIT 1`,
      [name]
    );

    if (userRows.length > 0) {
      const { rows: donationRows } = await pool.query(
        `SELECT SUM(amount) AS total, COUNT(*) AS count
         FROM donations
         WHERE donor_id = $1 AND status = 'completed'`,
        [userRows[0].id]
      );

      totalDonations = parseFloat(donationRows[0]?.total || 0);
      donationCount = parseInt(donationRows[0]?.count || 0);
    }

    const { rows } = await pool.query(
      `INSERT INTO hall_of_fame
       (name, profession, bio, photo, total_donations, donation_count)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, profession, bio || null, photoUrl, totalDonations, donationCount]
    );

    res.status(201).json({
      success: true,
      message: 'Hall of Fame member added successfully',
      member: rows[0]
    });
  } catch (error) {
    console.error('Create Hall of Fame error:', error);
    next(error);
  }
};

/**
 * Update Hall of Fame member (admin)
 */
export const updateHallOfFameMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, profession, bio } = req.body;
    let photoUrl = null;

    if (req.file) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { rows } = await pool.query(
          'SELECT photo FROM hall_of_fame WHERE id = $1',
          [id]
        );

        const old = extractPublicObjectPathFromUrl(rows[0]?.photo);
        if (old?.bucket && old?.objectPath) {
        await supabaseAdmin.storage
            .from(old.bucket)
            .remove([old.objectPath]);
        }

        const ext = req.file.originalname.split('.').pop();
        const newId = crypto.randomUUID();
        const objectPath = `dar-al-hikma/hall-of-fame/${newId}.${ext}`;

        const { error } = await supabaseAdmin.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });
        if (error) throw error;

        photoUrl = getPublicObjectUrl(SUPABASE_MEDIA_BUCKET, objectPath);
      } catch (err) {
        console.error('Photo update error:', err);
      }
    }

    const updates = [];
    const values = [];
    let i = 1;

    if (name) updates.push(`name = $${i++}`), values.push(name);
    if (profession) updates.push(`profession = $${i++}`), values.push(profession);
    if (bio !== undefined) updates.push(`bio = $${i++}`), values.push(bio);
    if (photoUrl) updates.push(`photo = $${i++}`), values.push(photoUrl);

    if (!updates.length) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE hall_of_fame
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${i}
       RETURNING *`,
      values
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({
      success: true,
      message: 'Hall of Fame member updated',
      member: rows[0]
    });
  } catch (error) {
    console.error('Update Hall of Fame error:', error);
    next(error);
  }
};

/**
 * Delete Hall of Fame member (admin)
 */
export const deleteHallOfFameMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabaseAdmin = getSupabaseAdmin();
    const { rows } = await pool.query(
      'SELECT photo FROM hall_of_fame WHERE id = $1',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const old = extractPublicObjectPathFromUrl(rows[0].photo);
    if (old?.bucket && old?.objectPath) {
      await supabaseAdmin.storage
        .from(old.bucket)
        .remove([old.objectPath]);
    }

    await pool.query('DELETE FROM hall_of_fame WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Hall of Fame member deleted'
    });
  } catch (error) {
    console.error('Delete Hall of Fame error:', error);
    next(error);
  }
};

/**
 * Clear all Hall of Fame members (admin only - use with caution)
 * This removes ALL members from hall_of_fame table
 */
export const clearAllHallOfFame = async (req, res, next) => {
  try {
    // Get all members to delete their photos
    const { rows: allMembers } = await pool.query('SELECT photo FROM hall_of_fame');
    
    const supabaseAdmin = getSupabaseAdmin();
    
    // Delete all photos from storage
    for (const member of allMembers) {
      if (member.photo) {
        try {
          const old = extractPublicObjectPathFromUrl(member.photo);
          if (old?.bucket && old?.objectPath) {
            await supabaseAdmin.storage
              .from(old.bucket)
              .remove([old.objectPath]);
          }
        } catch (photoError) {
          console.warn('Failed to delete photo:', photoError);
          // Continue even if photo deletion fails
        }
      }
    }
    
    // Delete all members from database
    await pool.query('DELETE FROM hall_of_fame');
    
    res.json({
      success: true,
      message: `All Hall of Fame members cleared (${allMembers.length} members removed)`
    });
  } catch (error) {
    console.error('Clear all Hall of Fame error:', error);
    next(error);
  }
};
