// backend/models/reservationModel.js
const pool = require("../db");

const ReservationModel = {
  // 🔹 Crear una reserva (estado inicial pendiente)
  async createReservation(client, { user_id, reservation_date, reservation_time, people_count, table_id, total }) {
    const q = `INSERT INTO reservations
      (user_id, reservation_date, reservation_time, people_count, table_id, total, status, pago_estado, pago_monto)
      VALUES ($1,$2,$3,$4,$5,$6,'pendiente','pendiente',0) RETURNING *`;
    const vals = [user_id, reservation_date, reservation_time, people_count, table_id, total || 0];
    const res = await client.query(q, vals);
    return res.rows[0];
  },

  // 🔹 Agregar plato a la reserva con validación de stock
  async addReservationItem(client, { reservation_id, dish_id, quantity, subtotal }) {
    // 1️⃣ Validamos stock del plato
    const check = await client.query("SELECT quantity FROM dishes WHERE id=$1", [dish_id]);
    if (check.rows.length === 0) {
      throw new Error("Plato no encontrado");
    }
    if (check.rows[0].quantity < quantity) {
      throw new Error("No hay suficiente stock para este plato");
    }

    // 2️⃣ Insertamos detalle de la reserva
    const q = `INSERT INTO reservation_details
      (reservation_id, dish_id, quantity, subtotal)
      VALUES ($1,$2,$3,$4) RETURNING *`;
    const vals = [reservation_id, dish_id, quantity, subtotal];
    const res = await client.query(q, vals);
    const detail = res.rows[0];

    // 3️⃣ Actualizamos stock del plato
    await client.query(
      "UPDATE dishes SET quantity = quantity - $1 WHERE id=$2",
      [quantity, dish_id]
    );

    // 4️⃣ Sumamos el subtotal al total de la reserva
    await client.query(
      "UPDATE reservations SET total = total + $1 WHERE id=$2",
      [subtotal, reservation_id]
    );

    return detail;
  },

  // 🔹 Obtener reserva por ID con items + pagos
  async getReservationById(id) {
    const r1 = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reservations r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.id=$1`,
      [id]
    );
    const reservation = r1.rows[0];
    if (!reservation) return null;

    const itemsRes = await pool.query(
      `SELECT rd.*, d.name 
       FROM reservation_details rd 
       JOIN dishes d ON rd.dish_id = d.id 
       WHERE rd.reservation_id=$1`,
      [id]
    );
    reservation.items = itemsRes.rows;

    const paymentsRes = await pool.query(
      `SELECT * FROM payments WHERE reservation_id=$1 ORDER BY created_at DESC`,
      [id]
    );
    reservation.payments = paymentsRes.rows;

    return reservation;
  },

  async getReservationsForUser(userId) {
    const res = await pool.query(
      "SELECT * FROM reservations WHERE user_id=$1 ORDER BY reservation_date DESC, reservation_time DESC",
      [userId]
    );
    return res.rows;
  },

  async getAllReservations() {
    const res = await pool.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reservations r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY reservation_date DESC, reservation_time DESC`
    );
    return res.rows;
  },

  // 🔹 Actualizar reserva (excepto pago)
  async updateReservation(id, data) {
    const q = `UPDATE reservations 
               SET reservation_date=$1, reservation_time=$2, people_count=$3, table_id=$4, total=$5 
               WHERE id=$6 RETURNING *`;
    const vals = [data.reservation_date, data.reservation_time, data.people_count, data.table_id, data.total, id];
    const res = await pool.query(q, vals);
    return res.rows[0];
  },

  async cancelReservation(id) {
    const res = await pool.query(
      "UPDATE reservations SET status='cancelada', pago_estado='cancelado' WHERE id=$1 RETURNING *",
      [id]
    );
    return res.rows[0];
  },

  async postponeReservation(id, newDate, newTime, newTableId) {
    const res = await pool.query(
      "UPDATE reservations SET reservation_date=$1, reservation_time=$2, table_id=$3 WHERE id=$4 RETURNING *",
      [newDate, newTime, newTableId, id]
    );
    return res.rows[0];
  },

  // 🔹 Registrar pago con validación del total
  async addPayment(client, { reservation_id, amount, method, status }) {
    // ✅ Primero verificamos el total de la reserva
    const resReserva = await client.query(
      "SELECT total FROM reservations WHERE id=$1",
      [reservation_id]
    );
    if (resReserva.rows.length === 0) throw new Error("Reserva no encontrada");

    const totalReserva = resReserva.rows[0].total;
    if (amount < totalReserva) {
      throw new Error(`El pago es insuficiente. Total: ${totalReserva}, pagado: ${amount}`);
    }

    // 1️⃣ Insertamos el pago
    const q = `INSERT INTO payments
      (reservation_id, amount, method, status, created_at)
      VALUES ($1,$2,$3,$4,NOW()) RETURNING *`;
    const vals = [reservation_id, amount, method, status];
    const res = await client.query(q, vals);
    const payment = res.rows[0];

    // 2️⃣ Si el pago fue exitoso, actualizamos reserva
    if (status === "pagado") {
      await this.markAsPaid(client, reservation_id, amount);
    }

    return payment;
  },

  // 🔹 Actualizar estado de la reserva a pagado
  async markAsPaid(client, reservation_id, amount) {
    const q = `
      UPDATE reservations 
      SET status = 'confirmada', 
          pago_estado = 'pagado', 
          pago_monto = $2
      WHERE id = $1 
      RETURNING *`;
    const res = await client.query(q, [reservation_id, amount]);
    return res.rows[0];
  },

  async getPaymentsByReservation(reservation_id) {
    const q = `SELECT * FROM payments WHERE reservation_id=$1 ORDER BY created_at DESC`;
    const res = await pool.query(q, [reservation_id]);
    return res.rows;
  },

  async getAllPayments() {
    const q = `SELECT * FROM payments ORDER BY created_at DESC`;
    const res = await pool.query(q);
    return res.rows;
  }
};

module.exports = ReservationModel;
