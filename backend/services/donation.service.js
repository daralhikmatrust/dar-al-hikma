/**
 * Donation Service
 * 
 * Core business logic for donation processing.
 * Handles order creation, payment verification, and state management.
 */

import Donation from '../models/Donation.model.js';
import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import { DonationStateMachine } from './donation-state-machine.service.js';
import { IdempotencyService } from './idempotency.service.js';
import pool from '../utils/db.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export class DonationService {
  /**
   * Create a Razorpay order and donation record
   */
  static async createOrder(orderData, user = null) {
    const {
      amount,
      currency = 'INR',
      donationType,
      project,
      faculty,
      notes,
      donorInfo,
      isAnonymous
    } = orderData;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('INVALID_AMOUNT');
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Prepare donor information
    let donorId = null;
    let donorName, donorEmail, donorPhone, donorAddress;

    // CRITICAL: If user is authenticated, ALWAYS set donorId
    if (user && user.id) {
      const userRecord = await User.findById(user.id);
      if (userRecord) {
        donorId = userRecord.id;
        donorName = userRecord.name;
        donorEmail = userRecord.email;
        donorPhone = userRecord.phone || null;
        donorAddress = typeof userRecord.address === 'string' 
          ? JSON.parse(userRecord.address) 
          : (userRecord.address || {});
      } else {
        // User ID provided but user not found - use user.id directly as fallback
        // This ensures authenticated users always have donorId set
        console.warn(`User with ID ${user.id} not found in database, using provided ID as donorId`);
        donorId = user.id;
        donorName = user.name || null;
        donorEmail = user.email || null;
        donorPhone = user.phone || null;
        donorAddress = typeof user.address === 'string' 
          ? JSON.parse(user.address) 
          : (user.address || {});
      }
    }

    // Override with guest info if provided (but preserve donorId if user is authenticated)
    if (donorInfo) {
      if (!donorId) {
        // Only override if no authenticated user
        donorName = donorInfo.name;
        donorEmail = donorInfo.email;
        donorPhone = donorInfo.phone || null;
        donorAddress = donorInfo.address || {};
      } else {
        // User is authenticated - use their info, but allow guest info to fill missing fields
        if (!donorName && donorInfo.name) donorName = donorInfo.name;
        if (!donorEmail && donorInfo.email) donorEmail = donorInfo.email;
        if (!donorPhone && donorInfo.phone) donorPhone = donorInfo.phone;
        if (!donorAddress && donorInfo.address) donorAddress = donorInfo.address;
      }
    }

    if (!donorName || !donorEmail) {
      throw new Error('MISSING_DONOR_INFO');
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        donationType,
        projectId: project || 'general'
      }
    });

    // Create donation record with idempotency protection
    const donation = await IdempotencyService.executeWithIdempotency(
      razorpayOrder.id,
      async (client) => {
        // Check if order already exists
        const { rows: existing } = await client.query(
          `SELECT * FROM donations WHERE order_id = $1`,
          [razorpayOrder.id]
        );

        if (existing.length > 0) {
          return Donation.mapRow(existing[0]);
        }

        // Create new donation
        const newDonation = await Donation.create({
          donorId,
          amount: Number(amount),
          currency,
          donationType,
          projectId: project || null,
          faculty: faculty || null,
          paymentMethod: 'razorpay',
          paymentId: null,
          orderId: razorpayOrder.id,
          status: DonationStateMachine.VALID_STATES.PENDING,
          donorName,
          donorEmail,
          donorPhone,
          donorAddress,
          isAnonymous: isAnonymous || false,
          notes: notes || null,
          metadata: {
            razorpay_order_amount: razorpayOrder.amount,
            razorpay_order_currency: razorpayOrder.currency,
            created_via: user ? 'authenticated' : 'guest',
            user_id: user?.id || null
          }
        });
        
        // Log donation creation for debugging
        console.log(`[DonationService.createOrder] Created donation ${newDonation.id || newDonation._id}: donorId=${donorId}, donorEmail=${donorEmail}, status=${newDonation.status}`);

        return newDonation;
      },
      { keyType: 'order_id' }
    );

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      donation: donation.result || donation.existing
    };
  }

  /**
   * Verify Razorpay payment signature
   */
  static verifyPaymentSignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  }

  /**
   * Verify and complete a payment
   * This is called from the frontend verify endpoint
   */
  static async verifyPayment(verificationData) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = verificationData;

    // Verify signature
    if (!this.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      throw new Error('INVALID_SIGNATURE');
    }

    // Process with idempotency protection
    return await IdempotencyService.executeWithIdempotency(
      razorpay_payment_id,
      async (client) => {
        // Get donation by order_id with lock
        const { rows: donations } = await client.query(
          `SELECT * FROM donations WHERE order_id = $1 FOR UPDATE`,
          [razorpay_order_id]
        );

        if (donations.length === 0) {
          throw new Error('DONATION_NOT_FOUND');
        }

        const donation = donations[0];

        // Check if already completed
        if (donation.status === DonationStateMachine.VALID_STATES.COMPLETED) {
          return Donation.mapRow(donation);
        }

        // Validate state transition
        const canComplete = DonationStateMachine.canComplete(donation.status);
        if (!canComplete.valid) {
          throw new Error(`INVALID_STATE_TRANSITION: ${canComplete.reason}`);
        }

        // Verify amount consistency with Razorpay
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        let paymentDetails;
        try {
          paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (error) {
          throw new Error('RAZORPAY_FETCH_ERROR');
        }

        // Verify amount matches
        const expectedAmount = Math.round(parseFloat(donation.amount) * 100);
        if (paymentDetails.amount !== expectedAmount) {
          throw new Error('AMOUNT_MISMATCH');
        }

        // Update donation status (client is already in transaction from IdempotencyService)
        const { rows: updated } = await client.query(
          `UPDATE donations 
           SET status = $1, 
               payment_id = $2,
               status_changed_at = NOW(),
               status_changed_by = 'verify_endpoint',
               verification_attempts = verification_attempts + 1,
               metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
               updated_at = NOW()
           WHERE order_id = $4
           RETURNING *`,
          [
            DonationStateMachine.VALID_STATES.COMPLETED,
            razorpay_payment_id,
            JSON.stringify({
              verified_at: new Date().toISOString(),
              verified_via: 'verify_endpoint',
              razorpay_payment_status: paymentDetails.status,
              razorpay_payment_method: paymentDetails.method,
              razorpay_payment_created_at: paymentDetails.created_at || null, // Payment capture timestamp from Razorpay
              payment_captured_at: paymentDetails.created_at ? new Date(paymentDetails.created_at * 1000).toISOString() : null // Convert Unix timestamp to ISO
            }),
            razorpay_order_id
          ]
        );

        const updatedDonation = updated[0];

        // Update project amount if applicable
        if (updatedDonation.project_id) {
          await this._updateProjectAmount(client, updatedDonation.project_id, updatedDonation.amount);
        }

        return Donation.mapRow(updatedDonation);
      },
      { 
        keyType: 'payment_id',
        checkStatus: true,
        terminalStates: ['completed']
      }
    );
  }

  /**
   * Process webhook event
   * This is the source of truth for payment status
   */
  static async processWebhookEvent(webhookEvent) {
    const { event, payload } = webhookEvent;
    const eventId = webhookEvent.id || `${event}_${Date.now()}`;

    // Record webhook event for deduplication
    const payment = payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    await IdempotencyService.recordWebhookEvent(
      eventId,
      event,
      orderId,
      paymentId,
      payload
    );

    // Check if already processed
    const existingEvent = await IdempotencyService.checkWebhookEvent(eventId);
    if (existingEvent && existingEvent.processed) {
      return { processed: false, reason: 'already_processed' };
    }

    // Process based on event type
    switch (event) {
      case 'payment.captured':
      case 'order.paid':
        return await this._handlePaymentCaptured(orderId, paymentId, eventId, payment);
      
      case 'payment.failed':
        return await this._handlePaymentFailed(orderId, paymentId, eventId);
      
      case 'payment.refunded':
        return await this._handlePaymentRefunded(orderId, paymentId, eventId, payload);
      
      default:
        return { processed: false, reason: 'unsupported_event' };
    }
  }

  /**
   * Handle payment captured webhook
   */
  static async _handlePaymentCaptured(orderId, paymentId, eventId, paymentDetails) {
    if (!orderId || !paymentId) {
      throw new Error('MISSING_WEBHOOK_DATA');
    }

    // If paymentDetails from webhook doesn't have full details (amount, created_at), fetch from Razorpay API
    let fullPaymentDetails = paymentDetails;
    if (!paymentDetails.amount || !paymentDetails.created_at) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        fullPaymentDetails = await razorpay.payments.fetch(paymentId);
        console.log(`[Webhook] Fetched payment details for ${paymentId}, created_at: ${fullPaymentDetails.created_at}`);
      } catch (error) {
        console.warn(`[Webhook] Failed to fetch payment details from Razorpay API for ${paymentId}:`, error.message);
        // Continue with webhook payment details if available
        fullPaymentDetails = paymentDetails;
      }
    }

    return await IdempotencyService.executeWithIdempotency(
      paymentId,
      async (client) => {
        // Get donation with lock
        const { rows: donations } = await client.query(
          `SELECT * FROM donations WHERE order_id = $1 FOR UPDATE`,
          [orderId]
        );

        if (donations.length === 0) {
          // Donation not found - might be orphaned webhook
          await IdempotencyService.markWebhookEventProcessed(
            eventId,
            orderId,
            paymentId,
            'Donation record not found'
          );
          return { processed: false, reason: 'donation_not_found' };
        }

        const donation = donations[0];

        // Check if already completed
        if (donation.status === DonationStateMachine.VALID_STATES.COMPLETED) {
          // Update webhook_event_id and payment capture time if missing
          const updates = [];
          const updateValues = [];
          let paramIndex = 1;
          
          if (!donation.webhook_event_id) {
            updates.push(`webhook_event_id = $${paramIndex++}`);
            updateValues.push(eventId);
          }
          
          // Update payment capture time if missing
          const currentMetadata = donation.metadata || {};
          if (!currentMetadata.payment_captured_at && (fullPaymentDetails.created_at || paymentDetails.created_at)) {
            const paymentTimestamp = fullPaymentDetails.created_at || paymentDetails.created_at;
            const paymentCaptureTime = new Date(paymentTimestamp * 1000).toISOString();
            const updatedMetadata = {
              ...currentMetadata,
              payment_captured_at: paymentCaptureTime,
              razorpay_payment_created_at: paymentTimestamp
            };
            updates.push(`metadata = $${paramIndex++}::jsonb`);
            updateValues.push(JSON.stringify(updatedMetadata));
          }
          
          if (updates.length > 0) {
            await client.query(
              `UPDATE donations SET ${updates.join(', ')} WHERE order_id = $${paramIndex}`,
              [...updateValues, orderId]
            );
          }
          
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);
          return { processed: false, reason: 'already_completed' };
        }

        // Validate state transition
        const canComplete = DonationStateMachine.canComplete(donation.status);
        if (!canComplete.valid) {
          const error = `Invalid state transition: ${canComplete.reason}`;
          await client.query(
            `UPDATE donations 
             SET last_error = $1::jsonb,
                 verification_attempts = verification_attempts + 1
             WHERE order_id = $2`,
            [
              JSON.stringify({
                error,
                timestamp: new Date().toISOString(),
                source: 'webhook'
              }),
              orderId
            ]
          );
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId, error);
          throw new Error(error);
        }

        // Verify amount consistency
        const expectedAmount = Math.round(parseFloat(donation.amount) * 100);
        const actualAmount = fullPaymentDetails.amount || paymentDetails.amount;
        
        if (actualAmount !== expectedAmount) {
          const error = `Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`;
          await client.query(
            `UPDATE donations 
             SET last_error = $1::jsonb,
                 verification_attempts = verification_attempts + 1
             WHERE order_id = $2`,
            [
              JSON.stringify({
                error,
                timestamp: new Date().toISOString(),
                source: 'webhook',
                expected_amount: expectedAmount,
                actual_amount: actualAmount
              }),
              orderId
            ]
          );
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId, error);
          throw new Error(error);
        }

        // Update donation
        await client.query('BEGIN');

        const { rows: updated } = await client.query(
          `UPDATE donations 
           SET status = $1,
               payment_id = $2,
               webhook_event_id = $3,
               status_changed_at = NOW(),
               status_changed_by = 'webhook',
               verification_attempts = verification_attempts + 1,
               metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
               last_error = NULL,
               updated_at = NOW()
           WHERE order_id = $5
           RETURNING *`,
          [
            DonationStateMachine.VALID_STATES.COMPLETED,
            paymentId,
            eventId,
            JSON.stringify({
              webhook_processed_at: new Date().toISOString(),
              razorpay_payment_status: fullPaymentDetails.status || paymentDetails.status || null,
              razorpay_payment_method: fullPaymentDetails.method || paymentDetails.method || null,
              razorpay_payment_created_at: fullPaymentDetails.created_at || paymentDetails.created_at || null, // Payment capture timestamp from Razorpay (Unix seconds)
              payment_captured_at: (fullPaymentDetails.created_at || paymentDetails.created_at) 
                ? new Date((fullPaymentDetails.created_at || paymentDetails.created_at) * 1000).toISOString() 
                : null // Convert Unix timestamp (seconds) to ISO string
            }),
            orderId
          ]
        );

        const updatedDonation = updated[0];

        // Update project amount
        if (updatedDonation.project_id) {
          await this._updateProjectAmount(client, updatedDonation.project_id, updatedDonation.amount);
        }

        await client.query('COMMIT');
        await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);

        return { 
          processed: true, 
          donation: Donation.mapRow(updatedDonation) 
        };
      },
      {
        keyType: 'payment_id',
        checkStatus: true
      }
    );
  }

  /**
   * Handle payment failed webhook
   */
  static async _handlePaymentFailed(orderId, paymentId, eventId) {
    return await IdempotencyService.executeWithIdempotency(
      orderId,
      async (client) => {
        const { rows: donations } = await client.query(
          `SELECT * FROM donations WHERE order_id = $1 FOR UPDATE`,
          [orderId]
        );

        if (donations.length === 0) {
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId, 'Donation not found');
          return { processed: false, reason: 'donation_not_found' };
        }

        const donation = donations[0];

        // Only update if not already in terminal state
        if (DonationStateMachine.isTerminalState(donation.status)) {
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);
          return { processed: false, reason: 'already_terminal' };
        }

        await client.query('BEGIN');

        await client.query(
          `UPDATE donations 
           SET status = $1,
               status_changed_at = NOW(),
               status_changed_by = 'webhook',
               metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
               updated_at = NOW()
           WHERE order_id = $3`,
          [
            DonationStateMachine.VALID_STATES.FAILED,
            JSON.stringify({
              failed_at: new Date().toISOString(),
              failed_via: 'webhook',
              payment_id: paymentId
            }),
            orderId
          ]
        );

        await client.query('COMMIT');
        await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);

        return { processed: true };
      },
      { keyType: 'order_id' }
    );
  }

  /**
   * Handle payment refunded webhook
   */
  static async _handlePaymentRefunded(orderId, paymentId, eventId, payload) {
    return await IdempotencyService.executeWithIdempotency(
      paymentId,
      async (client) => {
        const { rows: donations } = await client.query(
          `SELECT * FROM donations WHERE payment_id = $1 FOR UPDATE`,
          [paymentId]
        );

        if (donations.length === 0) {
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId, 'Donation not found');
          return { processed: false, reason: 'donation_not_found' };
        }

        const donation = donations[0];

        if (donation.status === DonationStateMachine.VALID_STATES.REFUNDED) {
          await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);
          return { processed: false, reason: 'already_refunded' };
        }

        await client.query('BEGIN');

        // Update donation to refunded
        await client.query(
          `UPDATE donations 
           SET status = $1,
               status_changed_at = NOW(),
               status_changed_by = 'webhook',
               metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
               updated_at = NOW()
           WHERE payment_id = $3`,
          [
            DonationStateMachine.VALID_STATES.REFUNDED,
            JSON.stringify({
              refunded_at: new Date().toISOString(),
              refunded_via: 'webhook',
              refund_details: payload.refund?.entity || {}
            }),
            paymentId
          ]
        );

        // Reverse project amount if applicable
        if (donation.project_id) {
          const { rows: project } = await client.query(
            `SELECT * FROM projects WHERE id = $1 FOR UPDATE`,
            [donation.project_id]
          );

          if (project[0]) {
            const newAmount = Math.max(0, parseFloat(project[0].current_amount || 0) - parseFloat(donation.amount));
            const targetAmount = parseFloat(project[0].target_amount || 0);
            const newProgress = targetAmount > 0
              ? Math.min(100, Math.round((newAmount / targetAmount) * 100))
              : 0;

            await client.query(
              `UPDATE projects SET current_amount = $1, progress = $2 WHERE id = $3`,
              [newAmount, newProgress, donation.project_id]
            );
          }
        }

        await client.query('COMMIT');
        await IdempotencyService.markWebhookEventProcessed(eventId, orderId, paymentId);

        return { processed: true };
      },
      { keyType: 'payment_id' }
    );
  }

  /**
   * Get payment by payment_id or order_id
   * Used for refresh-safe success page
   */
  static async getPaymentByIdentifier(identifier, identifierType = 'payment_id') {
    let donation;
    
    if (identifierType === 'payment_id') {
      donation = await Donation.findByPaymentId(identifier);
    } else if (identifierType === 'order_id') {
      donation = await Donation.findByOrderId(identifier);
    } else {
      throw new Error('INVALID_IDENTIFIER_TYPE');
    }

    if (!donation) {
      throw new Error('DONATION_NOT_FOUND');
    }

    // Only return completed donations for success page
    if (donation.status !== DonationStateMachine.VALID_STATES.COMPLETED) {
      throw new Error('PAYMENT_NOT_COMPLETED');
    }

    return donation;
  }

  /**
   * Update project amount atomically
   */
  static async _updateProjectAmount(client, projectId, donationAmount) {
    const { rows: project } = await client.query(
      `SELECT * FROM projects WHERE id = $1 FOR UPDATE`,
      [projectId]
    );

    if (!project[0]) {
      return;
    }

    const currentAmount = parseFloat(project[0].current_amount || 0);
    const newAmount = currentAmount + parseFloat(donationAmount);
    const targetAmount = parseFloat(project[0].target_amount || 0);
    const newProgress = targetAmount > 0
      ? Math.min(100, Math.round((newAmount / targetAmount) * 100))
      : (project[0].progress || 0);

    await client.query(
      `UPDATE projects SET current_amount = $1, progress = $2, updated_at = NOW() WHERE id = $3`,
      [newAmount, newProgress, projectId]
    );
  }
}
