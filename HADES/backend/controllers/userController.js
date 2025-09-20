const pool = require("../db");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

//  Crear usuario (ej: mesero, cliente, admin)
exports.crearUsuario = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      cedula,
      birth_date,
      phone,
      address,
      email,
      password,
      role,
    } = req.body;

    // Validar datos obligatorios
    if (!first_name || !last_name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Faltan datos obligatorios (nombre, apellido, email, password, role)" });
    }

    // Validar rol permitido
    if (!["admin", "mesero", "cliente"].includes(role)) {
      return res.status(400).json({
        error: "Rol inválido. Debe ser admin, mesero o cliente.",
      });
    }

    // Verificar si ya existe el email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en la DB
    const newUser = await User.create({
      first_name,
      last_name,
      cedula,
      birth_date,
      phone,
      address,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: newUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando usuario" });
  }
};

//  Activar usuario
exports.activarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE users SET estado = 'activo' WHERE id = $1 RETURNING id, first_name, last_name, email, role, estado",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario activado correctamente",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error activando usuario" });
  }
};

//  Desactivar usuario
exports.desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE users SET estado = 'inactivo' WHERE id = $1 RETURNING id, first_name, last_name, email, role, estado",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario desactivado correctamente",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error desactivando usuario" });
  }
};

//  Eliminar usuario (hard delete → se elimina físicamente de la BD)
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, first_name, last_name, email, role",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Usuario eliminado definitivamente",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
};

//  Listar usuarios (con filtros: estado y rol)
exports.listarUsuarios = async (req, res) => {
  try {
    const { estado, role } = req.query;
    let query =
      "SELECT id, first_name, last_name, email, role, estado, created_at FROM users";
    const values = [];
    const conditions = [];

    if (estado) {
      values.push(estado);
      conditions.push(`estado = $${values.length}`);
    }

    if (role) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando usuarios" });
  }
};

//  Detalle de usuario
exports.detalleUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT id, first_name, last_name, cedula, birth_date, phone, address, email, role, estado, created_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo detalle del usuario" });
  }
};

//  Cambiar rol de usuario
exports.cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["admin", "mesero", "cliente"].includes(role)) {
      return res.status(400).json({
        error: "Rol inválido. Debe ser admin, mesero o cliente.",
      });
    }

    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role, estado",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      message: "Rol actualizado correctamente",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cambiando rol de usuario" });
  }
};
