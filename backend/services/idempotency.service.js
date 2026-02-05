/**
 * Idempotency Service
 * 
 * Ensures operations can be safely retried without side effects.
 * Uses database-level locking to prevent race conditions.
 */

import pool from '../utils/db.js';

export class IdempotencyService {
  /**
   * Execute an operation with idempotency protection
   * 
   * @param {string} key - Unique idempotency key (e.g., order_id, payment_id, webhook_event_id)
   * @param {Function} operation - The operation to execute
   * @param {Object} options - Options for idempotency check
   * @returns {Promise<{executed: boolean, result?: any, existing?: any}>}
   */
  static async executeWithIdempotency(key, operation, options = {}) {
    const {
      keyType = 'order_id', // 'order_id', 'payment_id', 'webhook_event_id'
      checkFunction = null, // Custom check function
      lockTimeout = 5000 // Lock timeout in ms
    } = options;

    if (!key) {
      throw new Error('Idempotency key is required');
    }

    const client = await pool.connect();
    try {
      // Begin transaction for atomicity
      await client.query('BEGIN');

      // Check if operation was already executed
      let existing = null;
      
      if (checkFunction) {
        existing = await checkFunction(client, key);
      } else {
        existing = await this._checkExisting(client, key, keyType);
      }

      if (existing && this._isAlreadyProcessed(existing, options)) {
        await client.query('COMMIT');
        return {
          executed: false,
          existing: existing,
          result: existing
        };
      }

      // Execute the operation
      const result = await operation(client);

      await client.query('COMMIT');
      return {
        executed: true,
        result: result
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a webhook event was already processed
   */
  static async checkWebhookEvent(eventId) {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT * FROM webhook_events WHERE event_id = $1`,
        [eventId]
      );
      return rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Mark a webhook event as processed
   */
  static async markWebhookEventProcessed(eventId, orderId = null, paymentId = null, error = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already exists
      const existing = await this.checkWebhookEvent(eventId);
      
      if (existing) {
        // Update existing record
        await client.query(
          `UPDATE webhook_events 
           SET processed = $1, 
               processed_at = CASE WHEN $1 THEN NOW() ELSE processed_at END,
               error_message = $2,
               retry_count = retry_count + 1
           WHERE event_id = $3`,
          [true, error, eventId]
        );
      } else {
        // Insert new record (shouldn't happen if we check first, but safety)
        await client.query(
          `INSERT INTO webhook_events (event_id, order_id, payment_id, processed, processed_at, error_message)
           VALUES ($1, $2, $3, $4, NOW(), $5)
           ON CONFLICT (event_id) DO UPDATE SET
             processed = $4,
             processed_at = CASE WHEN $4 THEN NOW() ELSE webhook_events.processed_at END,
             error_message = $5,
             retry_count = webhook_events.retry_count + 1`,
          [eventId, orderId, paymentId, true, error]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record a webhook event (before processing)
   */
  static async recordWebhookEvent(eventId, eventType, orderId, paymentId, payload) {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO webhook_events (event_id, event_type, order_id, payment_id, payload)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (event_id) DO UPDATE SET
           retry_count = webhook_events.retry_count + 1,
           payload = EXCLUDED.payload`,
        [eventId, eventType, orderId, paymentId, JSON.stringify(payload)]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Private: Check if operation already exists
   */
  static async _checkExisting(client, key, keyType) {
    let query;
    let params;

    switch (keyType) {
      case 'order_id':
        query = `SELECT * FROM donations WHERE order_id = $1 FOR UPDATE`;
        params = [key];
        break;
      case 'payment_id':
        query = `SELECT * FROM donations WHERE payment_id = $1 FOR UPDATE`;
        params = [key];
        break;
      case 'webhook_event_id':
        query = `SELECT * FROM donations WHERE webhook_event_id = $1 FOR UPDATE`;
        params = [key];
        break;
      default:
        throw new Error(`Unknown key type: ${keyType}`);
    }

    const { rows } = await client.query(query, params);
    return rows[0] || null;
  }

  /**
   * Private: Check if existing record indicates operation was already processed
   */
  static _isAlreadyProcessed(existing, options) {
    const { 
      checkStatus = true,
      terminalStates = ['completed', 'cancelled', 'refunded']
    } = options;

    if (!checkStatus) {
      return false;
    }

    // If status is terminal, it's already processed
    if (existing.status && terminalStates.includes(existing.status)) {
      return true;
    }

    // If payment_id exists and status is completed, it's already processed
    if (existing.payment_id && existing.status === 'completed') {
      return true;
    }

    return false;
  }
}
