// middleware/authMiddleware.js

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "No autenticado. Inicia sesión." });
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
}

function isMesero(req, res, next) {
  if (req.session.user && req.session.user.role === "mesero") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requiere rol de mesero." });
}

function isCliente(req, res, next) {
  if (req.session.user && req.session.user.role === "cliente") {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requiere rol de cliente." });
}

function isAdminOrMesero(req, res, next) {
  if (req.session.user && (req.session.user.role === "admin" || req.session.user.role === "mesero")) {
    return next();
  }
  return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador o mesero." });
}


module.exports = {
  isAuthenticated,
  isAdmin,
  isMesero,
  isCliente,
  isAdminOrMesero
};
