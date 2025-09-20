const bcrypt = require("bcrypt");
const User = require("../models/userModel");

const authController = {
  // Registro de usuario (cliente o mesero)
  async register(req, res) {
    try {
      const { first_name, last_name, cedula, birth_date, phone, address, email, password, role } = req.body;

      // Verificar si ya existe el correo
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "El correo ya está registrado" });
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const newUser = await User.create({
        first_name,
        last_name,
        cedula,
        birth_date,
        phone,
        address,
        email,
        password: hashedPassword,
        role
      });

      res.status(201).json({ message: "Usuario registrado correctamente", user: newUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) return res.status(400).json({ error: "Credenciales inválidas" });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Credenciales inválidas" });

      // Guardamos el usuario en la sesión
      req.session.user = {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      };

      res.json({ message: "Login exitoso", user: req.session.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error en login" });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Error al cerrar sesión" });
        }
        res.clearCookie("connect.sid"); // elimina cookie de sesión
        res.json({ message: "Sesión cerrada correctamente" });
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error en logout" });
    }
  },

  // Ver sesión activa
  async me(req, res) {
    if (req.session.user) {
      return res.json({ loggedIn: true, user: req.session.user });
    }
    res.json({ loggedIn: false });
  },

  // Actualizar usuario autenticado
  async update(req, res) {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      const { first_name, last_name, phone, address } = req.body;

      const updatedUser = await User.update(req.session.user.id, {
        first_name,
        last_name,
        phone,
        address
      });

      // Actualizamos la sesión también
      req.session.user = {
        ...req.session.user,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        email: updatedUser.email,
        role: updatedUser.role
      };

      res.json({ message: "Usuario actualizado correctamente", user: req.session.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar usuario" });
    }
  },

  // 🔥 Eliminar usuario (solo admin)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const deletedUser = await User.delete(id);
      res.json({ message: "Usuario eliminado correctamente", user: deletedUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al eliminar usuario" });
    }
  }
};

module.exports = authController;
