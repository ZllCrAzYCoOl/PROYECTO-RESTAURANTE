// backend/server.js
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const dishRoutes = require("./routes/dishRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = 4000;

// Middleware
app.use(bodyParser.json());

// Configuración de sesión
app.use(session({
  secret: "supersecreto",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // en producción con HTTPS → true
}));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, "../FrontEnd")));

// Servidor imágenes subidas
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas backend
app.use("/api/auth", authRoutes);
app.use("/api/reservas", reservationRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
