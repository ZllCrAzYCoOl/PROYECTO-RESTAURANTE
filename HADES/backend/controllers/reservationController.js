// backend/controllers/reservationController.js
const pool = require("../db");
const ReservationModel = require("../models/reservationModel");
const { findAvailableTable } = require("../services/reservationService");

// utils
function parseDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`);
}

const ReservationController = {
  // Crear reserva
  async crearReserva(req, res) {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ error: "Debes estar autenticado" });

      const { reservation_date, reservation_time, people_count, items } = req.body;
      if (!reservation_date || !reservation_time || !people_count) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
      }

      // Validaciones de fecha/hora
      const now = new Date();
      const requestedDT = parseDateTime(reservation_date, reservation_time);
      const todayStr = now.toISOString().slice(0, 10);

      if (new Date(reservation_date) < new Date(todayStr)) {
        return res.status(400).json({ error: "La fecha debe ser hoy o futura" });
      }

      if (reservation_date === todayStr) {
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        if (requestedDT < oneHourLater) {
          return res.status(400).json({ error: "La hora debe ser al menos 1 hora en el futuro" });
        }
      }

      const pc = Number(people_count);
      if (!Number.isInteger(pc) || pc < 1 || pc > 8) {
        return res.status(400).json({ error: "people_count debe ser entero entre 1 y 8" });
      }

      // Buscar mesa disponible
      const table = await findAvailableTable(pc, reservation_date, reservation_time, 90);
      if (!table) {
        return res.status(400).json({ error: "No hay mesas disponibles para ese horario" });
      }

      // Crear transacción reserva + items
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const reservation = await ReservationModel.createReservation(client, {
          user_id: user.id,
          reservation_date,
          reservation_time,
          people_count: pc,
          table_id: table.id,
          total: 0,
          pago_estado: "pendiente"
        });

        let total = 0;
        if (Array.isArray(items) && items.length) {
          for (const it of items) {
            const qty = Number(it.quantity) || 1;
            const subtotal = Number(it.subtotal) || 0; // usamos el enviado o calculamos en frontend
            total += subtotal;

            // 🔹 Ahora addReservationItem descuenta stock automáticamente
            await ReservationModel.addReservationItem(client, {
              reservation_id: reservation.id,
              dish_id: it.dish_id,
              quantity: qty,
              subtotal
            });
          }
          await client.query("UPDATE reservations SET total=$1 WHERE id=$2", [total, reservation.id]);
        }

        await client.query("COMMIT");
        const full = await ReservationModel.getReservationById(reservation.id);
        return res.status(201).json({ message: "Reserva creada", reservation: full });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error creando reserva" });
    }
  },

  //  Listar reservas
  async listarReservas(req, res) {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ error: "No autenticado" });

      if (user.role === "admin" || user.role === "mesero") {
        const all = await ReservationModel.getAllReservations();
        return res.json({ reservations: all });
      } else {
        const my = await ReservationModel.getReservationsForUser(user.id);
        return res.json({ reservations: my });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error listando reservas" });
    }
  },

  //  Ver detalle de una reserva
  async detalleReserva(req, res) {
    try {
      const user = req.session.user;
      if (!user) return res.status(401).json({ error: "No autenticado" });

      const { id } = req.params;
      const reservation = await ReservationModel.getReservationById(id);
      if (!reservation) return res.status(404).json({ error: "Reserva no encontrada" });

      if (user.role === "cliente" && reservation.user_id !== user.id) {
        return res.status(403).json({ error: "No tienes permiso para ver esta reserva" });
      }

      return res.json({ reservation });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error obteniendo reserva" });
    }
  },

  //  Cancelar reserva
async cancelarReserva(req, res) {
  const client = await pool.connect();
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "No autenticado" });

    const { id } = req.params;
    const reservation = await ReservationModel.getReservationById(id);
    if (!reservation) return res.status(404).json({ error: "Reserva no encontrada" });

    if (user.role === "cliente" && reservation.user_id !== user.id) {
      return res.status(403).json({ error: "No tienes permiso para cancelar esta reserva" });
    }

    await client.query("BEGIN");

    // 🔹 Devolver stock de los platos reservados
    const items = await client.query(
      "SELECT dish_id, quantity FROM reservation_details WHERE reservation_id=$1",
      [id]
    );

    for (const it of items.rows) {
      await client.query(
        "UPDATE dishes SET quantity = quantity + $1 WHERE id=$2",
        [it.quantity, it.dish_id]
      );
    }

    // 🔹 Marcar la reserva como cancelada
    const canceled = await ReservationModel.cancelReservation(id);

    await client.query("COMMIT");
    return res.json({ message: "Reserva cancelada", reservation: canceled });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error cancelando reserva" });
  } finally {
    client.release();
  }
},

// Editar reserva
async editarReserva(req, res) {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "No autenticado" });

    const { id } = req.params;
    const { reservation_date, reservation_time, people_count, items } = req.body;

    const reservation = await ReservationModel.getReservationById(id);
    if (!reservation) return res.status(404).json({ error: "Reserva no encontrada" });

    if (user.role === "cliente" && reservation.user_id !== user.id) {
      return res.status(403).json({ error: "No tienes permiso para editar esta reserva" });
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (new Date(reservation_date) < new Date(todayStr)) {
      return res.status(400).json({ error: "La fecha debe ser hoy o futura" });
    }
    if (reservation_date === todayStr) {
      const requestedDT = parseDateTime(reservation_date, reservation_time);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      if (requestedDT < oneHourLater) {
        return res.status(400).json({ error: "La hora debe ser al menos 1 hora en el futuro" });
      }
    }

    const pc = Number(people_count);
    if (!Number.isInteger(pc) || pc < 1 || pc > 8) {
      return res.status(400).json({ error: "people_count debe ser entero entre 1 y 8" });
    }

    const table = await findAvailableTable(pc, reservation_date, reservation_time, 90);
    if (!table) return res.status(400).json({ error: "No hay mesas disponibles para ese horario" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 🔹 Devolver stock de los items anteriores
      const oldItems = await client.query("SELECT dish_id, quantity FROM reservation_details WHERE reservation_id=$1", [id]);
      for (const oi of oldItems.rows) {
        await client.query("UPDATE dishes SET quantity = quantity + $1 WHERE id=$2", [oi.quantity, oi.dish_id]);
      }

      // 🔹 Actualizar datos de la reserva
      await ReservationModel.updateReservation(id, {
        reservation_date,
        reservation_time,
        people_count: pc,
        table_id: table.id,
        total: 0
      });

      // 🔹 Eliminar items antiguos
      await client.query("DELETE FROM reservation_details WHERE reservation_id=$1", [id]);

      // 🔹 Insertar nuevos items y descontar stock
      let total = 0;
      if (Array.isArray(items) && items.length) {
        for (const it of items) {
          const qty = Number(it.quantity) || 1;
          const subtotal = Number(it.subtotal) || 0;
          total += subtotal;

          await ReservationModel.addReservationItem(client, {
            reservation_id: id,
            dish_id: it.dish_id,
            quantity: qty,
            subtotal
          });
        }
        await client.query("UPDATE reservations SET total=$1 WHERE id=$2", [total, id]);
      }

      await client.query("COMMIT");
      const full = await ReservationModel.getReservationById(id);
      return res.json({ message: "Reserva editada", reservation: full });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error editando reserva" });
  }
},

//  Registrar pago
async pagarReserva(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params; // id de la reserva
    const { monto, metodo } = req.body;

    // Validar usuario autenticado
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "No autenticado" });

    // Obtener reserva
    const reserva = await ReservationModel.getReservationById(id);
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

    // 🔹 Si es cliente, solo puede pagar su propia reserva
    if (user.role === "cliente" && reserva.user_id !== user.id) {
      return res.status(403).json({ error: "No tienes permiso para pagar esta reserva" });
    }

    // Validar monto
    if (Number(monto) !== Number(reserva.total)) {
      return res.status(400).json({ 
        error: `El monto a pagar (${monto}) no coincide con el total de la reserva (${reserva.total})`
      });
    }

    await client.query("BEGIN");

    // Registrar el pago usando el modelo (esto actualiza también la reserva si status = pagado)
    const pago = await ReservationModel.addPayment(client, {
      reservation_id: id,
      amount: monto,
      method: metodo || "efectivo",
      status: "pagado"
    });

    await client.query("COMMIT");

    const full = await ReservationModel.getReservationById(id);

    res.json({
      message: "Pago registrado con éxito",
      reserva: full,
      pago
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error al registrar pago:", err);
    res.status(500).json({ error: "Error al procesar el pago" });
  } finally {
    client.release();
  }
},

// Aplazar reserva
async aplazarReserva(req, res) {
  const client = await pool.connect();
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: "No autenticado" });

    const { id } = req.params;
    const { nueva_fecha, nueva_hora } = req.body;

    const reserva = await ReservationModel.getReservationById(id);
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });

    // Solo el dueño (cliente) o admin/mesero pueden aplazar
    if (user.role === "cliente" && reserva.user_id !== user.id) {
      return res.status(403).json({ error: "No tienes permiso para aplazar esta reserva" });
    }

    await client.query("BEGIN");

    const updated = await ReservationModel.updateReservation(id, {
      reservation_date: nueva_fecha || reserva.reservation_date,
      reservation_time: nueva_hora || reserva.reservation_time,
      people_count: reserva.people_count,
      table_id: reserva.table_id,
      total: reserva.total
    });

    await client.query("COMMIT");

    return res.json({ message: "Reserva aplazada correctamente", reservation: updated });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error aplazando reserva" });
  } finally {
    client.release();
  }
}

};

module.exports = ReservationController;
