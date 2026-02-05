import pool from "../utils/db.js";
import bcrypt from "bcryptjs";

export default class User {
  static async findByEmail(email, withPassword = false) {
    const query = withPassword
      ? "SELECT * FROM users WHERE email = $1"
      : `
        SELECT 
          id, name, email, role, profession, phone,
          address, is_hall_of_fame, created_at
        FROM users WHERE email = $1
      `;

    const { rows } = await pool.query(query, [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `
      SELECT 
        id, name, email, role, profession, phone,
        address, is_hall_of_fame, created_at
      FROM users WHERE id = $1
      `,
      [id]
    );
    return rows[0] || null;
  }

  static async create({
    name,
    email,
    password,
    phone = null,
    profession = "Other",
    address = {},
    role = "user",
  }) {
    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `
      INSERT INTO users 
        (name, email, password, phone, profession, address, role)
      VALUES 
        ($1, $2, $3, $4, $5, $6::jsonb, $7)
      RETURNING 
        id, name, email, role, profession, phone, address, created_at
      `,
      [
        name,
        email.toLowerCase(),
        hashedPassword,
        phone,
        profession,
        JSON.stringify(address), // ✅ IMPORTANT FIX
        role,
      ]
    );

    return rows[0];
  }

  static async update(id, updates) {
    const allowedFields = {
      name: "name",
      phone: "phone",
      profession: "profession",
      address: "address",
      refresh_token: "refresh_token",
      reset_password_token: "reset_password_token",
      reset_password_expire: "reset_password_expire",
      is_hall_of_fame: "is_hall_of_fame",
    };

    const fields = [];
    const values = [];
    let index = 1;

    for (const key in updates) {
      if (!allowedFields[key]) continue;

      if (key === "address") {
        fields.push(`${allowedFields[key]} = $${index}::jsonb`);
        values.push(JSON.stringify(updates[key]));
      } else {
        fields.push(`${allowedFields[key]} = $${index}`);
        values.push(updates[key]);
      }
      index++;
    }

    if (!fields.length) return null;

    const { rows } = await pool.query(
      `
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${index}
      RETURNING 
        id, name, email, role, profession, phone, address, is_hall_of_fame, created_at
      `,
      [...values, id]
    );

    return rows[0] || null;
  }

  static async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}
