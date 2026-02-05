import crypto from 'crypto';
import { DonationService } from '../services/donation.service.js';
import { ErrorClassification } from '../services/error-classification.service.js';
import { IdempotencyService } from '../services/idempotency.service.js';

/**
 * Handle Razorpay webhook events
 * 
 * This is the SOURCE OF TRUTH for payment status.
 * Webhooks are idempotent and handle all edge cases:
 * - User closes browser before verify endpoint
 * - Network failures during verify
 * - Duplicate webhook deliveries
 * - Race conditions between verify and webhook
 */
export const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(500).json({ 
      status: 'error', 
      message: 'Webhook secret not configured' 
    });
  }

  // 1. Verify webhook signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    console.error('Invalid Razorpay webhook signature', {
      received: req.headers['x-razorpay-signature'],
      expected: digest,
      timestamp: new Date().toISOString()
    });
    return res.status(400).json({ 
      status: 'error', 
      message: 'Invalid signature' 
    });
  }

  const event = req.body;
  const eventId = event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Log webhook receipt
    console.log('Webhook received:', {
      event: event.event,
      eventId: eventId,
      timestamp: new Date().toISOString()
    });

    // Process webhook event
    const result = await DonationService.processWebhookEvent(event);

    if (result.processed) {
      console.log('Webhook processed successfully:', {
        event: event.event,
        eventId: eventId,
        orderId: event.payload?.payment?.entity?.order_id,
        paymentId: event.payload?.payment?.entity?.id
      });

      // Send receipt email if payment was completed
      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        if (result.donation) {
          // Non-blocking: Don't fail webhook if email fails
          try {
            const { generateReceiptPDF } = await import('../utils/generateReceipt.js');
            const { sendDonationReceiptEmail } = await import('../utils/sendEmail.js');
            const Project = (await import('../models/Project.model.js')).default;
            
            let projectData = null;
            if (result.donation.projectId) {
              projectData = await Project.findById(result.donation.projectId);
            }

            const receiptBuffer = await generateReceiptPDF(result.donation, projectData);
            await sendDonationReceiptEmail(result.donation, receiptBuffer);
          } catch (emailError) {
            // Log but don't fail webhook
            console.warn('Receipt email failed (non-critical):', emailError.message);
          }
        }
      }

      return res.status(200).json({ 
        status: 'ok',
        processed: true
      });
    } else {
      // Already processed or unsupported event
      console.log('Webhook skipped:', {
        event: event.event,
        eventId: eventId,
        reason: result.reason
      });

      return res.status(200).json({ 
        status: 'ok',
        processed: false,
        reason: result.reason
      });
    }
  } catch (error) {
    const classification = ErrorClassification.classify(error);
    
    console[classification.logLevel]('Webhook processing error:', {
      event: event.event,
      eventId: eventId,
      error: classification.internalMessage,
      timestamp: new Date().toISOString()
    });

    // Mark webhook event with error
    try {
      const payment = event.payload?.payment?.entity;
      await IdempotencyService.markWebhookEventProcessed(
        eventId,
        payment?.order_id,
        payment?.id,
        classification.internalMessage
      );
    } catch (markError) {
      console.error('Failed to mark webhook event:', markError);
    }

    if (classification.requiresAlert) {
      console.error('⚠️ ALERT REQUIRED - Webhook processing failed:', classification.internalMessage);
    }

    // Return 500 for transient errors (Razorpay will retry)
    // Return 200 for permanent errors (Razorpay won't retry)
    const statusCode = classification.retryable ? 500 : 200;
    
    return res.status(statusCode).json({ 
      status: 'error', 
      message: classification.internalMessage 
    });
  }
};
