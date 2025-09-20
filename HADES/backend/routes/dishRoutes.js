const express = require("express");
const router = express.Router();
const dishController = require("../controllers/dishController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

//  Carpeta donde se guardarán las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/dishes"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

//  Solo el admin puede gestionar los platos
router.post("/", 
  authMiddleware.isAuthenticated, 
  authMiddleware.isAdmin, 
  upload.single("image"),   //  se sube la imagen
  dishController.crearPlato
);

router.get("/", dishController.listarPlatos);
router.get("/:id", dishController.detallePlato);

router.put("/:id", 
  authMiddleware.isAuthenticated, 
  authMiddleware.isAdmin, 
  upload.single("image"),  //  permite actualizar con nueva imagen
  dishController.editarPlato
);

router.delete("/:id", authMiddleware.isAuthenticated, authMiddleware.isAdmin, dishController.eliminarPlato);

module.exports = router;
