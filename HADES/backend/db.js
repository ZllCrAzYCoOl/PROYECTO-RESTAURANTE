const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",       // cambia según tu configuración
  host: "localhost",
  database: "hades_db", // cambia al nombre de tu BD
  password: "DavidAvila1380#",
  port: 5432,
});

module.exports = pool;
