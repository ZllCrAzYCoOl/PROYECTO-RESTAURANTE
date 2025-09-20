const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

//  Cliente puede registrar su pago
router.post(
  "/",
  authMiddleware.isAuthenticated,
  authMiddleware.isCliente,
  paymentController.createPayment
);

//  Admin y mesero pueden consultar todos los pagos
router.get(
  "/",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdminOrMesero,
  paymentController.getAllPayments
);

//  Consultar pagos de una reserva (cliente, mesero, admin)
router.get(
  "/reservation/:reservation_id",
  authMiddleware.isAuthenticated,
  paymentController.getPaymentsForReservation
);

module.exports = router;
