const pool = require('../config/db');

const InscripcionModel = {
    async create(data) {
        const { torneo_id, jugador_id } = data;
        const query = `
            INSERT INTO inscripciones (torneo_id, jugador_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [torneo_id, jugador_id]);
        return result.rows[0];
    },

    async getByTorneo(torneoId) {
        const query = `
            SELECT i.*, j.nombre as jugador_nombre, c.descripcion as jugador_categoria
            FROM inscripciones i
            JOIN jugadores j ON i.jugador_id = j.id
            LEFT JOIN categorias c ON j.categoria_id = c.id
            WHERE i.torneo_id = $1
            ORDER BY j.nombre ASC
        `;
        const result = await pool.query(query, [torneoId]);
        return result.rows;
    },

    async registrarPago(id, monto, metodo) {
        const query = `
            UPDATE inscripciones
            SET pagado = TRUE, monto_abonado = $2, fecha_pago = CURRENT_TIMESTAMP, metodo_pago = $3, caja_id = (SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1)
            WHERE id = $1
            RETURNING *
        `;
        const result = await pool.query(query, [id, monto, metodo]);
        return result.rows[0];
    }
};

module.exports = InscripcionModel;
