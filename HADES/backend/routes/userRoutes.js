const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

//  Listar todos los usuarios (solo admin)
router.get(
  "/",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.listarUsuarios
);

//  Ver detalle de un usuario (solo admin)
router.get(
  "/:id",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.detalleUsuario
);

// Activar usuario
router.patch(
  "/:id/activate",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.activarUsuario
);

//  Desactivar usuario
router.patch(
  "/:id/deactivate",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.desactivarUsuario
);

//  Cambiar rol (cliente <-> mesero, etc.)
router.patch(
  "/:id/role",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.cambiarRol
);

//  Eliminar usuario (soft delete → estado = eliminado)
router.delete(
  "/:id",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.eliminarUsuario
);

//  Solo admin puede crear usuarios
router.post(
  "/crear",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  userController.crearUsuario
);
module.exports = router;
