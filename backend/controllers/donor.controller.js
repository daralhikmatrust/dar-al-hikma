import User from '../models/User.model.js';
import Donation from '../models/Donation.model.js';
import pool from '../utils/db.js';

// Get all donors (admin only)
export const getDonors = async (req, res, next) => {
  try {
    const { profession, hallOfFame } = req.query;
    const filter = {};

    if (profession) filter.profession = profession;
    if (hallOfFame === 'true') filter.isHallOfFame = true;

    // Get all users with role 'user' (donors)
    let query = `
      SELECT 
        id, name, email, role, profession, phone,
        address, is_hall_of_fame, created_at, updated_at
      FROM users 
      WHERE role = 'user'
    `;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (profession) {
      conditions.push(`profession = $${paramCount++}`);
      values.push(profession);
    }
    if (hallOfFame === 'true') {
      conditions.push(`is_hall_of_fame = true`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, values);
    const donors = rows.map(row => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      profession: row.profession,
      phone: row.phone,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : (row.address || {}),
      isHallOfFame: row.is_hall_of_fame || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      count: donors.length,
      donors
    });
  } catch (error) {
    next(error);
  }
};

// Get donor stats
export const getDonorStats = async (req, res, next) => {
  try {
    const donorId = req.params.id || req.user.id;
    
    const donations = await Donation.find({ 
      donorId: donorId,
      status: 'completed'
    });

    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const donationCount = donations.length;
    const byType = {};
    const byFaculty = {};

    donations.forEach(d => {
      const type = d.donationType || d.donation_type;
      const amount = parseFloat(d.amount || 0);
      byType[type] = (byType[type] || 0) + amount;
      if (d.faculty) {
        byFaculty[d.faculty] = (byFaculty[d.faculty] || 0) + amount;
      }
    });

    res.json({
      success: true,
      stats: {
        totalAmount,
        donationCount,
        byType,
        byFaculty
      }
    });
  } catch (error) {
    console.error('Get donor stats error:', error);
    next(error);
  }
};

// Update donor (mark Hall of Fame, etc.) - admin only
export const updateDonor = async (req, res, next) => {
  try {
    const { isHallOfFame, profession } = req.body;
    const updates = {};
    
    if (isHallOfFame !== undefined) updates.is_hall_of_fame = isHallOfFame;
    if (profession) updates.profession = profession;

    const updatedDonor = await User.update(req.params.id, updates);

    if (!updatedDonor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    const donorData = {
      _id: updatedDonor.id,
      id: updatedDonor.id,
      name: updatedDonor.name,
      email: updatedDonor.email,
      role: updatedDonor.role,
      profession: updatedDonor.profession,
      phone: updatedDonor.phone,
      address: typeof updatedDonor.address === 'string' ? JSON.parse(updatedDonor.address) : (updatedDonor.address || {}),
      isHallOfFame: updatedDonor.is_hall_of_fame || false,
      createdAt: updatedDonor.created_at
    };

    res.json({
      success: true,
      donor: donorData
    });
  } catch (error) {
    console.error('Update donor error:', error);
    next(error);
  }
};

// Get Hall of Fame donors (public)
// ONLY shows members added by admin via hall_of_fame table
// Users with is_hall_of_fame flag are NOT displayed (admin must explicitly add them)
export const getHallOfFame = async (req, res, next) => {
  try {
    // Only fetch from hall_of_fame table (admin-added members only)
    let hallRows = [];
    try {
      const r = await pool.query(
        `SELECT id, name, profession, photo, bio, total_donations, donation_count, created_at
         FROM hall_of_fame 
         ORDER BY total_donations DESC, created_at DESC`
      );
      hallRows = r.rows || [];
    } catch (e) {
      // hall_of_fame table may not exist
      if (e.code === '42P01') {
        return res.json({ success: true, donors: [] });
      }
      throw e;
    }

    const donors = hallRows.map((row) => ({
      _id: row.id,
      id: row.id,
      name: row.name,
      profession: row.profession,
      photo: row.photo,
      bio: row.bio,
      totalDonations: parseFloat(row.total_donations || 0),
      donationCount: parseInt(row.donation_count || 0),
      createdAt: row.created_at,
    }));

    res.json({ success: true, donors });
  } catch (error) {
    console.error('Get Hall of Fame error:', error);
    next(error);
  }
};

