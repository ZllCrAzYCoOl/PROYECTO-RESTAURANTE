const pool = require("../db");

const User = {
  async create(data) {
    const query = `
      INSERT INTO users (first_name, last_name, cedula, birth_date, phone, address, email, password, role)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, first_name, last_name, email, role
    `;
    const values = [
      data.first_name,
      data.last_name,
      data.cedula,
      data.birth_date,
      data.phone,
      data.address,
      data.email,
      data.password,
      data.role
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  },

  async update(id, data) {
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, phone = $3, address = $4
      WHERE id = $5
      RETURNING id, first_name, last_name, email, role
    `;
    const values = [data.first_name, data.last_name, data.phone, data.address, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  //  Nuevo: eliminar usuario
  async delete(id) {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, first_name, last_name, email, role", [id]);
    return result.rows[0];
  }
};

module.exports = User;
