import pool from "../utils/db.js";

export default class Donation {
  static async create({
    donorId = null,
    amount,
    currency = "INR",
    donationType,
    projectId = null,
    faculty = null,
    paymentMethod,
    paymentId,
    orderId,
    status = "pending",
    donorName,
    donorEmail,
    donorPhone = null,
    donorAddress = {},
    isAnonymous = false,
    notes = null,
    metadata = {},
  }) {
    // Generate receipt number
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*) FROM donations"
    );
    const count = parseInt(countRows[0].count || "0", 10);

    const receiptNumber = `DAH-${Date.now()}-${String(count + 1).padStart(6, "0")}`;

    const { rows } = await pool.query(
      `
      INSERT INTO donations (
        donor_id, amount, currency, donation_type, project_id, faculty,
        payment_method, payment_id, order_id, status, receipt_number,
        donor_name, donor_email, donor_phone, donor_address,
        is_anonymous, notes, metadata
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,$15::jsonb,
        $16,$17,$18::jsonb
      )
      RETURNING *
      `,
      [
        donorId,
        Number(amount),
        currency,
        donationType,
        projectId,
        faculty,
        paymentMethod,
        paymentId,
        orderId,
        status,
        receiptNumber,
        donorName,
        donorEmail,
        donorPhone,
        JSON.stringify(donorAddress),
        isAnonymous,
        notes,
        JSON.stringify(metadata),
      ]
    );

    return this.mapRow(rows[0]);
  }

  static async find(filters = {}) {
    let query = `
      SELECT d.*,
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
    `;

    const conditions = [];
    const values = [];
    let i = 1;

    if (filters.status) {
      conditions.push(`d.status = $${i++}`);
      values.push(filters.status);
    }
    if (filters.donationType) {
      conditions.push(`d.donation_type = $${i++}`);
      values.push(filters.donationType);
    }
    if (filters.projectId) {
      conditions.push(`d.project_id = $${i++}`);
      values.push(filters.projectId);
    }
    if (filters.donorId) {
      conditions.push(`d.donor_id = $${i++}`);
      values.push(filters.donorId);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY d.created_at DESC";

    if (filters.limit) {
      query += ` LIMIT $${i}`;
      values.push(Number(filters.limit));
    }

    const { rows } = await pool.query(query, values);
    return rows.map(this.mapRow);
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `
      SELECT d.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) AS donor,
        json_build_object(
          'id', p.id,
          'title', p.title,
          'description', p.description
        ) AS project
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.id = $1
      `,
      [id]
    );

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  static async updateStatus(id, status) {
    const { rows } = await pool.query(
      `
      UPDATE donations
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  static async getStats() {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) AS total_donations,
        COALESCE(SUM(amount),0) AS total_amount
      FROM donations
      WHERE status = 'completed'
    `);
    return rows[0];
  }

  static async findByOrderId(orderId) {
    const { rows } = await pool.query(
      `SELECT * FROM donations WHERE order_id = $1`,
      [orderId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  static async findByPaymentId(paymentId) {
    const { rows } = await pool.query(
      `SELECT * FROM donations WHERE payment_id = $1`,
      [paymentId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  static async findByWebhookEventId(webhookEventId) {
    const { rows } = await pool.query(
      `SELECT * FROM donations WHERE webhook_event_id = $1`,
      [webhookEventId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  static async updateStatusByOrderId(orderId, status) {
    const { rows } = await pool.query(
      `UPDATE donations SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *`,
      [status, orderId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  /**
   * Get donations that need attention (stuck in processing, failed verifications, etc.)
   */
  static async findNeedingAttention(limit = 50) {
    const { rows } = await pool.query(
      `SELECT * FROM donations 
       WHERE (
         (status = 'processing' AND created_at < NOW() - INTERVAL '1 hour')
         OR (status = 'pending' AND created_at < NOW() - INTERVAL '24 hours')
         OR (verification_attempts > 3 AND status != 'completed')
         OR (last_error IS NOT NULL AND status != 'failed')
       )
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(this.mapRow);
  }

  static mapRow(row) {
    if (!row) return null;

    return {
      id: row.id,
      amount: Number(row.amount),
      currency: row.currency,
      donationType: row.donation_type,
      faculty: row.faculty,
      status: row.status,
      receiptNumber: row.receipt_number,
      donorName: row.donor_name,
      donorEmail: row.donor_email,
      donorPhone: row.donor_phone,
      donorAddress: row.donor_address,
      isAnonymous: row.is_anonymous,
      paymentMethod: row.payment_method,
      paymentId: row.payment_id,
      orderId: row.order_id,
      donorId: row.donor_id,
      projectId: row.project_id,
      donor: row.donor,
      project: row.project,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // New fields
      metadata: row.metadata || {},
      webhookEventId: row.webhook_event_id,
      statusChangedAt: row.status_changed_at,
      statusChangedBy: row.status_changed_by,
      verificationAttempts: row.verification_attempts || 0,
      lastError: row.last_error,
      notes: row.notes
    };
  }
}
