const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Registro de usuario
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Logout
router.post("/logout", authController.logout);

// Verificar sesión activa
router.get("/me", authController.me);

// Actualizar usuario autenticado
router.put("/update", authMiddleware.isAuthenticated, authController.update);

//  Eliminar usuario (solo admin)
router.delete(
  "/delete/:id",
  authMiddleware.isAuthenticated,
  authMiddleware.isAdmin,
  authController.deleteUser
);

module.exports = router;
