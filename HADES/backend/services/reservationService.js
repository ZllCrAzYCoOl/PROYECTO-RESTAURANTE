// backend/services/reservationService.js
const pool = require("../db");

/**
 * Encuentra una mesa disponible que tenga capacidad >= peopleCount
 * y que no esté ocupada en la ventana de +/- ventanaMinutos (por defecto 90 min)
 * para la fecha + hora solicitadas.
 *
 * Devuelve fila de table { id, table_number, capacity } o null si no hay.
 */
async function findAvailableTable(peopleCount, dateStr, timeStr, ventanaMinutos = 90) {
  // ventana en segundos
  const ventanaSeg = ventanaMinutos * 60;

  // Query: buscamos mesas con capacity >= peopleCount que no estén en la lista de mesas ocupadas
  const query = `
    SELECT t.id, t.table_number, t.capacity
    FROM tables t
    WHERE t.available = true AND t.capacity >= $1
      AND t.id NOT IN (
        SELECT r.table_id FROM reservations r
        WHERE r.reservation_date = $2
          AND r.status <> 'cancelada'
          AND ABS(EXTRACT(EPOCH FROM (r.reservation_time::time - $3::time))) < $4
      )
    ORDER BY t.capacity ASC
    LIMIT 1
  `;
  const vals = [peopleCount, dateStr, timeStr, ventanaSeg];
  const { rows } = await pool.query(query, vals);
  return rows[0] || null;
}

module.exports = { findAvailableTable };
