import Donation from '../models/Donation.model.js';
import Project from '../models/Project.model.js';
import { generateReceiptPDF } from '../utils/generateReceipt.js';
import { sendDonationReceiptEmail } from '../utils/sendEmail.js';
import { DonationService } from '../services/donation.service.js';
import { ErrorClassification } from '../services/error-classification.service.js';
import pool from '../utils/db.js';

/**
 * Create Razorpay order and donation record
 * Idempotent: Safe to retry if order creation fails
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const orderData = {
      amount: req.body.amount,
      currency: req.body.currency || 'INR',
      donationType: req.body.donationType,
      project: req.body.project,
      faculty: req.body.faculty,
      notes: req.body.notes,
      donorInfo: req.body.donorInfo,
      isAnonymous: req.body.isAnonymous || false
    };

    // Log user info for debugging
    if (req.user) {
      console.log(`[createRazorpayOrder] Authenticated user: ${req.user.id} (${req.user.email})`);
    } else {
      console.log(`[createRazorpayOrder] Guest donation - no user in request`);
    }

    const result = await DonationService.createOrder(orderData, req.user || null);
    
    // Log donation creation
    if (result.donation) {
      console.log(`[createRazorpayOrder] Donation created: ID=${result.donation.id || result.donation._id}, donorId=${result.donation.donorId || result.donation.donor_id || 'NULL'}, donorEmail=${result.donation.donorEmail || result.donation.donor_email || 'NULL'}, status=${result.donation.status}`);
      
      // If user is authenticated but donorId is null, link it immediately
      if (req.user && req.user.id && (!result.donation.donorId && !result.donation.donor_id)) {
        try {
          await pool.query(
            `UPDATE donations SET donor_id = $1::uuid, updated_at = NOW() WHERE id = $2::uuid`,
            [req.user.id, result.donation.id || result.donation._id]
          );
          console.log(`[createRazorpayOrder] Linked donation ${result.donation.id || result.donation._id} to user ${req.user.id} immediately after creation`);
        } catch (linkError) {
          console.error('[createRazorpayOrder] Failed to link donation:', linkError);
        }
      }
    }

    res.json({
      success: true,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    
    console[classification.logLevel](`Order creation error [${classification.type}]:`, {
      message: classification.internalMessage,
      user: req.user?.id || 'guest',
      timestamp: new Date().toISOString()
    });

    if (classification.requiresAlert) {
      // TODO: Send alert to monitoring system
      console.error('⚠️ ALERT REQUIRED:', classification.internalMessage);
    }

    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};

/**
 * Verify Razorpay payment
 * Idempotent: Safe to retry - returns existing result if already processed
 * Webhook is source of truth, but this provides immediate feedback to user
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const verificationData = {
      razorpay_order_id: req.body.razorpay_order_id,
      razorpay_payment_id: req.body.razorpay_payment_id,
      razorpay_signature: req.body.razorpay_signature
    };

    const result = await DonationService.verifyPayment(verificationData);
    
    // Check if already processed (idempotency)
    if (!result.executed && result.existing) {
      const existingDonation = result.existing;
      
      // Link donation to authenticated user if email matches and donor_id is null
      if (req.user && req.user.id && req.user.email && 
          (!existingDonation.donorId || existingDonation.donorId === null) &&
          existingDonation.donorEmail && 
          existingDonation.donorEmail.toLowerCase() === req.user.email.toLowerCase()) {
        try {
          await pool.query(
            `UPDATE donations SET donor_id = $1::uuid, updated_at = NOW() WHERE id = $2::uuid`,
            [req.user.id, existingDonation.id || existingDonation._id]
          );
          console.log(`Linked donation ${existingDonation.id} to user ${req.user.id}`);
        } catch (linkError) {
          console.warn('Failed to link donation to user:', linkError);
        }
      }
      
      // Still try to send receipt if not sent before
      try {
        let projectData = null;
        if (existingDonation.projectId) {
          projectData = await Project.findById(existingDonation.projectId);
        }
        const receiptBuffer = await generateReceiptPDF(existingDonation, projectData);
        await sendDonationReceiptEmail(existingDonation, receiptBuffer);
      } catch (emailError) {
        // Non-critical - receipt might have been sent already
        console.warn('Receipt email error (non-critical):', emailError.message);
      }

      return res.json({
        success: true,
        donation: existingDonation,
        message: 'Payment already verified'
      });
    }

    const donation = result.result;
    
    // CRITICAL: Link donation to authenticated user if they're logged in
    // This ensures the donation appears in their dashboard immediately
    if (req.user && req.user.id) {
      try {
        // Always try to link if user is authenticated (even if donor_id is already set, update it to ensure consistency)
        const { rowCount } = await pool.query(
          `UPDATE donations 
           SET donor_id = $1::uuid, 
               updated_at = NOW()
           WHERE id = $2::uuid
           AND (donor_id IS NULL OR donor_id != $1::uuid)`,
          [req.user.id, donation.id || donation._id]
        );
        if (rowCount > 0) {
          console.log(`[verifyRazorpayPayment] Linked donation ${donation.id || donation._id} to user ${req.user.id}`);
          // Refresh donation object
          const { rows } = await pool.query('SELECT * FROM donations WHERE id = $1::uuid', [donation.id || donation._id]);
          if (rows[0]) {
            donation.donorId = req.user.id;
            donation.donor_id = req.user.id; // Also set snake_case version
          }
        } else if (donation.donorId && donation.donorId.toString() !== req.user.id.toString()) {
          console.warn(`[verifyRazorpayPayment] Donation ${donation.id} already has donor_id ${donation.donorId}, user is ${req.user.id}`);
        }
      } catch (linkError) {
        console.error('Failed to link donation to user:', linkError);
        // Don't fail the request, but log the error
      }
    }

    // Post-transaction actions (non-blocking)
    // Payment is already committed, so failures here don't affect payment status
    try {
      let projectData = null;
      if (donation.projectId) {
        projectData = await Project.findById(donation.projectId);
      }

      const receiptBuffer = await generateReceiptPDF(donation, projectData);
      await sendDonationReceiptEmail(donation, receiptBuffer);

      res.json({
        success: true,
        donation: donation,
        receipt: receiptBuffer.toString('base64')
      });
    } catch (emailError) {
      console.error('Post-payment email error (non-critical):', emailError);
      // Payment is successful, just email failed
      res.json({
        success: true,
        donation: donation,
        message: 'Payment successful. Receipt email may be delayed.'
      });
    }
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    
    console[classification.logLevel](`Payment verification error [${classification.type}]:`, {
      message: classification.internalMessage,
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      timestamp: new Date().toISOString()
    });

    if (classification.requiresAlert) {
      console.error('⚠️ ALERT REQUIRED:', classification.internalMessage);
    }

    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};

/**
 * Get user's donations
 * Returns donations where:
 * 1. donor_id matches user.id (authenticated donations)
 * 2. donor_email matches user.email (guest donations that were later linked)
 */
export const getMyDonations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email?.toLowerCase();
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get ALL donations for this user by:
    // 1. donor_id matches user.id (authenticated donations)
    // 2. donor_email matches user.email (ensures we catch all transactions, including guest donations)
    const { rows } = await pool.query(
      `SELECT d.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'profession', u.profession
        ) AS donor,
        json_build_object(
          'id', p.id,
          'title', p.title
        ) AS project
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE (
        (d.donor_id IS NOT NULL AND d.donor_id::text = $1::text) 
        OR 
        (d.donor_email IS NOT NULL AND LOWER(TRIM(d.donor_email)) = $2)
      )
      ORDER BY d.created_at DESC`,
      [userId.toString(), userEmail || '']
    );
    
    const allDonations = rows.map(row => Donation.mapRow(row));
    
    // Deduplicate by donation ID (in case same donation matches both conditions)
    const uniqueDonations = [];
    const seenIds = new Set();
    for (const donation of allDonations) {
      const donationId = (donation.id || donation._id || '').toString();
      if (donationId && !seenIds.has(donationId)) {
        seenIds.add(donationId);
        uniqueDonations.push(donation);
      }
    }

    const total = uniqueDonations.reduce((sum, d) => {
      return sum + (d.status === 'completed' ? parseFloat(d.amount || 0) : 0);
    }, 0);

    // Link any unlinked donations with matching email to this user
    // This ensures donations created before user registration appear in dashboard
    if (userEmail) {
      try {
        const { rowCount } = await pool.query(
          `UPDATE donations 
           SET donor_id = $1::uuid, updated_at = NOW()
           WHERE (donor_id IS NULL OR donor_id::text != $1::text)
           AND donor_email IS NOT NULL 
           AND LOWER(TRIM(donor_email)) = $2`,
          [userId.toString(), userEmail]
        );
        if (rowCount > 0) {
          console.log(`[getMyDonations] Linked ${rowCount} unlinked donation(s) to user ${userId}`);
          // Re-fetch donations after linking
          const { rows: updatedRows } = await pool.query(
            `SELECT d.*,
              json_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email,
                'profession', u.profession
              ) AS donor,
              json_build_object(
                'id', p.id,
                'title', p.title
              ) AS project
            FROM donations d
            LEFT JOIN users u ON d.donor_id = u.id
            LEFT JOIN projects p ON d.project_id = p.id
            WHERE (
              (d.donor_id IS NOT NULL AND d.donor_id::text = $1::text) 
              OR 
              (d.donor_email IS NOT NULL AND LOWER(TRIM(d.donor_email)) = $2)
            )
            ORDER BY d.created_at DESC`,
            [userId.toString(), userEmail]
          );
          const updatedDonations = updatedRows.map(row => Donation.mapRow(row));
          const seenIds = new Set();
          const finalDonations = [];
          for (const donation of updatedDonations) {
            const donationId = (donation.id || donation._id || '').toString();
            if (donationId && !seenIds.has(donationId)) {
              seenIds.add(donationId);
              finalDonations.push(donation);
            }
          }
          const finalTotal = finalDonations.reduce((sum, d) => {
            return sum + (d.status === 'completed' ? parseFloat(d.amount || 0) : 0);
          }, 0);
          
          console.log(`[getMyDonations] User ${userId} (${userEmail}): Found ${finalDonations.length} donations after linking`);
          
          return res.json({
            success: true,
            donations: finalDonations,
            total: finalTotal
          });
        }
      } catch (linkError) {
        console.error('Error linking donations:', linkError);
        // Continue with existing results even if linking fails
      }
    }

    // Enhanced logging for debugging
    console.log(`[getMyDonations] User ${userId} (${userEmail}):`);
    console.log(`  - Query returned ${rows.length} rows`);
    console.log(`  - After deduplication: ${uniqueDonations.length} donations`);
    
    if (uniqueDonations.length > 0) {
      console.log(`  - Sample donation IDs: ${uniqueDonations.slice(0, 3).map(d => d.id || d._id).join(', ')}`);
      console.log(`  - Statuses: ${uniqueDonations.map(d => d.status).join(', ')}`);
    } else {
      // Debug: Check if there are ANY donations in the database
      const { rows: allDonationsCheck } = await pool.query(
        `SELECT 
         COUNT(*) as total, 
         COUNT(CASE WHEN donor_id::text = $1 THEN 1 END) as by_donor_id,
         COUNT(CASE WHEN donor_email IS NOT NULL AND LOWER(TRIM(donor_email)) = $2 THEN 1 END) as by_email,
         COUNT(CASE WHEN donor_id IS NULL THEN 1 END) as null_donor_id
         FROM donations`,
        [userId.toString(), userEmail || '']
      );
      console.log(`  - Database check: Total=${allDonationsCheck[0].total}, by_donor_id=${allDonationsCheck[0].by_donor_id}, by_email=${allDonationsCheck[0].by_email}, null_donor_id=${allDonationsCheck[0].null_donor_id}`);
      
      // If we found donations by email but they're not linked, link them now
      if (allDonationsCheck[0].by_email > 0 && allDonationsCheck[0].by_donor_id === '0') {
        console.log(`  - Found ${allDonationsCheck[0].by_email} unlinked donation(s) by email - attempting to link...`);
        try {
          const { rowCount } = await pool.query(
            `UPDATE donations 
             SET donor_id = $1::uuid, updated_at = NOW()
             WHERE (donor_id IS NULL OR donor_id::text != $1::text)
             AND donor_email IS NOT NULL 
             AND LOWER(TRIM(donor_email)) = $2`,
            [userId.toString(), userEmail]
          );
          if (rowCount > 0) {
            console.log(`  - Successfully linked ${rowCount} donation(s)`);
            // Re-query after linking
            const { rows: newRows } = await pool.query(
              `SELECT d.*,
                json_build_object(
                  'id', u.id,
                  'name', u.name,
                  'email', u.email,
                  'profession', u.profession
                ) AS donor,
                json_build_object(
                  'id', p.id,
                  'title', p.title
                ) AS project
              FROM donations d
              LEFT JOIN users u ON d.donor_id = u.id
              LEFT JOIN projects p ON d.project_id = p.id
              WHERE (
                (d.donor_id IS NOT NULL AND d.donor_id::text = $1::text) 
                OR 
                (d.donor_email IS NOT NULL AND LOWER(TRIM(d.donor_email)) = $2)
              )
              ORDER BY d.created_at DESC`,
              [userId.toString(), userEmail || '']
            );
            const newDonations = newRows.map(row => Donation.mapRow(row));
            const newSeenIds = new Set();
            const newUniqueDonations = [];
            for (const donation of newDonations) {
              const donationId = (donation.id || donation._id || '').toString();
              if (donationId && !newSeenIds.has(donationId)) {
                newSeenIds.add(donationId);
                newUniqueDonations.push(donation);
              }
            }
            const newTotal = newUniqueDonations.reduce((sum, d) => {
              return sum + (d.status === 'completed' ? parseFloat(d.amount || 0) : 0);
            }, 0);
            
            console.log(`  - After linking: Found ${newUniqueDonations.length} donations`);
            
            return res.json({
              success: true,
              donations: newUniqueDonations,
              total: newTotal
            });
          }
        } catch (linkError) {
          console.error('  - Error linking donations:', linkError);
        }
      }
    }

    res.json({
      success: true,
      donations: uniqueDonations,
      total
    });
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    console[classification.logLevel]('Get donations error:', classification.internalMessage);
    console.error('Full error:', error);
    console.error('User:', req.user);
    
    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};

/**
 * Get donation by ID
 */
export const getDonationById = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ 
        success: false,
        message: 'Donation not found' 
      });
    }

    // Check authorization
    if (donation.donorId && donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    console[classification.logLevel]('Get donation error:', classification.internalMessage);
    
    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};

/**
 * Get payment by payment_id or order_id
 * Used for refresh-safe success page
 */
export const getPaymentByIdentifier = async (req, res, next) => {
  try {
    const { payment_id, order_id } = req.query;

    if (!payment_id && !order_id) {
      return res.status(400).json({
        success: false,
        message: 'Either payment_id or order_id is required'
      });
    }

    const identifier = payment_id || order_id;
    const identifierType = payment_id ? 'payment_id' : 'order_id';

    const donation = await DonationService.getPaymentByIdentifier(identifier, identifierType);

    // Authorization check
    if (req.user) {
      if (donation.donorId && donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      donation
    });
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    console[classification.logLevel]('Get payment error:', classification.internalMessage);
    
    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};

/**
 * Download receipt
 * Allows access without auth for guest donations
 */
export const downloadReceipt = async (req, res, next) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ 
        success: false,
        message: 'Donation not found' 
      });
    }

    // Authorization check (if authenticated)
    if (req.user) {
      if (donation.donorId && donation.donorId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
      }
    }

    let projectData = null;
    if (donation.projectId) {
      try {
        projectData = await Project.findById(donation.projectId);
      } catch (err) {
        console.warn('Error fetching project for receipt:', err.message);
      }
    }

    const receiptBuffer = await generateReceiptPDF(donation, projectData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${donation.receiptNumber || donation.receipt_number || 'donation'}.pdf`);
    res.send(receiptBuffer);
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    console[classification.logLevel]('Download receipt error:', classification.internalMessage);
    
    res.status(classification.statusCode).json({
      success: false,
      message: classification.userMessage
    });
  }
};
