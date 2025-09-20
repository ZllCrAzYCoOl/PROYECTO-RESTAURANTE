const pool = require("../db");
const ReservationModel = require("../models/reservationModel");

exports.createPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { reservation_id, amount, method } = req.body;

    if (!reservation_id || !amount || !method) {
      return res.status(400).json({ error: "Faltan datos del pago" });
    }

    const payment = await ReservationModel.addPayment(client, {
      reservation_id,
      amount,
      method,
      status: "pagado" // puedes simular que siempre se paga con éxito
    });

    res.json({ message: "Pago registrado correctamente", payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registrando el pago" });
  } finally {
    client.release();
  }
};

exports.getPaymentsForReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const payments = await ReservationModel.getPaymentsByReservation(reservation_id);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo pagos de la reserva" });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await ReservationModel.getAllPayments();
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo todos los pagos" });
  }
};
