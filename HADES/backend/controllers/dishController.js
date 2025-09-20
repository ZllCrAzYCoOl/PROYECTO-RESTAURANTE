const pool = require("../db");
const path = require("path");

// Crear plato
exports.crearPlato = async (req, res) => {
  try {
    const { name, description, price, available, category, quantity } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: "Nombre, precio y categoría son obligatorios" });
    }

    // Ruta de la imagen subida (si existe)
    let image_url = null;
    if (req.file) {
      image_url = `/uploads/dishes/${req.file.filename}`;
    }

    // ID del usuario logueado (admin o mesero que crea el plato)
    const createdBy = req.session.user ? req.session.user.id : null;

    const result = await pool.query(
      `INSERT INTO dishes (name, description, price, available, category, image_url, created_by, quantity) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description || "", price, available ?? true, category, image_url, createdBy, quantity ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear el plato" });
  }
};

// Listar platos
exports.listarPlatos = async (req, res) => {
  try {
    const { category } = req.query;
    let result;

    if (category) {
      result = await pool.query("SELECT * FROM dishes WHERE category = $1 ORDER BY created_at DESC", [category]);
    } else {
      result = await pool.query("SELECT * FROM dishes ORDER BY created_at DESC");
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al listar los platos" });
  }
};

// Detalle plato
exports.detallePlato = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM dishes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el plato" });
  }
};

// Editar plato
exports.editarPlato = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, available, category, quantity } = req.body;

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/dishes/${req.file.filename}`;
    }

    const result = await pool.query(
      `UPDATE dishes 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           available = COALESCE($4, available),
           category = COALESCE($5, category),
           image_url = COALESCE($6, image_url),
           quantity = COALESCE($7, quantity)
       WHERE id = $8 RETURNING *`,
      [name, description, price, available, category, image_url, quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el plato" });
  }
};

// Eliminar plato
exports.eliminarPlato = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM dishes WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Plato no encontrado" });
    }

    res.json({ message: "Plato eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el plato" });
  }
};
