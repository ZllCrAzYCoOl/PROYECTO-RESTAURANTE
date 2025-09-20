// backend/routes/reservationRoutes.js
const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const authMiddleware = require("../middleware/authMiddleware");

// Crear reserva (cliente, mesero o admin pueden crear si quieres; normalmente cliente)
router.post("/", authMiddleware.isAuthenticated, authMiddleware.isCliente, reservationController.crearReserva);

// Listar reservas (admin/mesero -> todas; cliente -> solo propias)
router.get("/", authMiddleware.isAuthenticated, reservationController.listarReservas);

// Detalle de reserva
router.get("/:id", authMiddleware.isAuthenticated, reservationController.detalleReserva);

// Cancelar reserva
router.patch("/:id/cancel", authMiddleware.isAuthenticated, reservationController.cancelarReserva);

// Aplazar reserva
router.patch("/:id/postpone", authMiddleware.isAuthenticated, reservationController.aplazarReserva);

// Editar reserva
router.put("/:id", authMiddleware.isAuthenticated, reservationController.editarReserva);

module.exports = router;
