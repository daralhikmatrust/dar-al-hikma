import Donation from '../models/Donation.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import Media from '../models/Media.model.js';
import pool from '../utils/db.js';


// Dashboard stats
export const getDashboardStats = async (req, res, next) => {
  try {
    // Total donations - handle case where table might not exist
    let totalDonations = { total: 0, count: 0 };
    try {
      const totalDonationsResult = await pool.query(
        'SELECT SUM(amount) as total, COUNT(*) as count FROM donations WHERE status = $1',
        ['completed']
      );
      totalDonations = totalDonationsResult.rows[0] || { total: 0, count: 0 };
    } catch (dbError) {
      // If table doesn't exist, return empty stats
      if (dbError.code === '42P01') {
        console.log('Donations table does not exist yet');
        return res.json({
          success: true,
          stats: {
            totalDonations: 0,
            totalDonationCount: 0,
            donationsByType: [],
            donationsByFaculty: [],
            recentDonations: [],
            projectStats: [],
            donorCount: 0,
            hallOfFameCount: 0,
            professionDistribution: []
          }
        });
      }
      throw dbError;
    }

    // Donations by type
    let donationsByType = [];
    try {
      const donationsByTypeResult = await pool.query(
        `SELECT donation_type as _id, SUM(amount) as total, COUNT(*) as count 
         FROM donations WHERE status = 'completed' 
         GROUP BY donation_type`
      );
      donationsByType = donationsByTypeResult.rows;
    } catch (err) {
      console.log('Error fetching donations by type:', err.message);
    }

    // Donations by faculty
    let donationsByFaculty = [];
    try {
      const donationsByFacultyResult = await pool.query(
        `SELECT faculty as _id, SUM(amount) as total, COUNT(*) as count 
         FROM donations WHERE status = 'completed' AND faculty IS NOT NULL 
         GROUP BY faculty`
      );
      donationsByFaculty = donationsByFacultyResult.rows;
    } catch (err) {
      console.log('Error fetching donations by faculty:', err.message);
    }

    // Recent donations
    let recentDonations = [];
    try {
      const recentDonationsResult = await pool.query(
        `SELECT d.*, 
                json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'profession', u.profession) as donor,
                json_build_object('id', p.id, 'title', p.title) as project
         FROM donations d
         LEFT JOIN users u ON d.donor_id = u.id
         LEFT JOIN projects p ON d.project_id = p.id
         ORDER BY d.created_at DESC
         LIMIT 10`
      );
      recentDonations = recentDonationsResult.rows.map(row => Donation.mapRow(row));
    } catch (err) {
      console.log('Error fetching recent donations:', err.message);
    }

    // Project stats
    let projectStats = [];
    try {
      const projectStatsResult = await pool.query(
        `SELECT status as _id, COUNT(*) as count, 
                SUM(target_amount) as total_target, 
                SUM(current_amount) as total_current
         FROM projects GROUP BY status`
      );
      projectStats = projectStatsResult.rows;
    } catch (err) {
      console.log('Error fetching project stats:', err.message);
    }

    // Donor count - using PostgreSQL
    let donorCount = 0;
    let registeredDonorCount = 0;
    let anonymousDonorCount = 0;
    let activeUsers = 0;
    let hallOfFameCount = 0;
    let professionDistribution = [];
    let donationStatus = [];
    
    try {
      const donorCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'user'`
      );
      donorCount = parseInt(donorCountResult.rows[0]?.count || 0);

      const activeUsersResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'user' AND created_at >= NOW() - INTERVAL '30 days'`
      );
      activeUsers = parseInt(activeUsersResult.rows[0]?.count || 0);

      const registeredDonorsResult = await pool.query(
        `SELECT COUNT(DISTINCT donor_id) as count
         FROM donations
         WHERE status = 'completed' AND donor_id IS NOT NULL`
      );
      registeredDonorCount = parseInt(registeredDonorsResult.rows[0]?.count || 0);

      const anonymousDonorsResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM donations
         WHERE status = 'completed' AND (is_anonymous = true OR donor_id IS NULL)`
      );
      anonymousDonorCount = parseInt(anonymousDonorsResult.rows[0]?.count || 0);
      
      // Only count from hall_of_fame table (admin-added members only)
      try {
        const hofResult = await pool.query(`SELECT COUNT(*) as count FROM hall_of_fame`);
        hallOfFameCount = parseInt(hofResult.rows[0]?.count || 0);
      } catch (hofErr) {
        // hall_of_fame table may not exist
        hallOfFameCount = 0;
      }

      // Profession distribution
      const professionDistributionResult = await pool.query(
        `SELECT profession as _id, COUNT(*) as count 
         FROM users WHERE role = 'user' 
         GROUP BY profession`
      );
      professionDistribution = professionDistributionResult.rows;

      const donationStatusResult = await pool.query(
        `SELECT status as _id, COUNT(*) as count, SUM(amount) as total
         FROM donations
         GROUP BY status`
      );
      donationStatus = donationStatusResult.rows;
    } catch (err) {
      console.log('Error fetching user stats:', err.message);
    }

    res.json({
      success: true,
      stats: {
        totalDonations: parseFloat(totalDonations?.total || 0),
        totalDonationCount: parseInt(totalDonations?.count || 0),
        donationsByType,
        donationsByFaculty,
        recentDonations,
        projectStats,
        donorCount,
        registeredDonorCount,
        anonymousDonorCount,
        activeUsers,
        hallOfFameCount,
        professionDistribution,
        donationStatus
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};

// Get all admins
export const getAllAdmins = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, profession, phone, created_at, updated_at
       FROM users WHERE role = 'admin'
       ORDER BY created_at DESC`
    );
    
    res.json({
      success: true,
      admins: result.rows
    });
  } catch (error) {
    console.error('Get admins error:', error);
    next(error);
  }
};

// Create new admin
export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    next(error);
  }
};

// Update user role (promote to admin or demote)
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be "admin" or "user"'
      });
    }

    // Prevent demoting the last admin
    if (role === 'user') {
      const adminCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        ['admin']
      );
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({
          message: 'Cannot demote the last admin. At least one admin must exist.'
        });
      }
    }

    const result = await pool.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at`,
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    next(error);
  }
};

// Delete admin (only if not the last one)
export const deleteAdmin = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    // Check if this is the last admin
    const adminCount = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );
    
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({
        message: 'Cannot delete the last admin. At least one admin must exist.'
      });
    }

    // Check if admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({
        message: 'Admin not found'
      });
    }

    // Delete admin
    await pool.query('DELETE FROM users WHERE id = $1', [adminId]);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    next(error);
  }
};

// Get all donations with filters (admin)
export const getAllDonations = async (req, res, next) => {
  try {
    const { status, donationType, project, faculty, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    if (donationType) {
      whereClause += ` AND d.donation_type = $${paramIndex}`;
      params.push(donationType);
      paramIndex++;
    }
    if (project) {
      whereClause += ` AND d.project_id = $${paramIndex}`;
      params.push(project);
      paramIndex++;
    }
    if (faculty) {
      whereClause += ` AND d.faculty = $${paramIndex}`;
      params.push(faculty);
      paramIndex++;
    }
    if (startDate) {
      whereClause += ` AND d.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    if (endDate) {
      whereClause += ` AND d.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get donations
    const donationsQuery = `
      SELECT d.*, 
             json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'profession', u.profession) as donor,
             json_build_object('id', p.id, 'title', p.title) as project
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), skip);
    
    const donationsResult = await pool.query(donationsQuery, params);
    const donations = donationsResult.rows.map(row => Donation.mapRow(row));

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM donations d ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove limit and offset params
    const total = parseInt(countResult.rows[0]?.total || 0);

    res.json({
      success: true,
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all donations error:', error);
    next(error);
  }
};

// Export donations to CSV
export const exportDonations = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.name as donor_name, u.email as donor_email, p.title as project_title
       FROM donations d
       LEFT JOIN users u ON d.donor_id = u.id
       LEFT JOIN projects p ON d.project_id = p.id
       WHERE d.status = 'completed'
       ORDER BY d.created_at DESC`
    );
    const donations = result.rows;

    // Convert to CSV format
    const headers = ['Receipt Number', 'Date', 'Donor Name', 'Email', 'Amount', 'Currency', 'Type', 'Project', 'Faculty', 'Payment Method'];
    const rows = donations.map(d => [
      d.receipt_number || '',
      new Date(d.created_at).toLocaleDateString(),
      d.donor_name || '',
      d.donor_email || '',
      d.amount,
      d.currency,
      d.donation_type,
      d.project_title || '',
      d.faculty || '',
      d.payment_method
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=donations.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
