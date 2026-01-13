const pool = require('../config/db');

const PagoModel = {
    async create(pagoData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Obtener caja abierta
            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            const { turno_id, monto, metodo } = pagoData;

            // 1. Registrar el pago
            const pagoQuery = `
                INSERT INTO pagos (turno_id, monto, metodo, caja_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const pagoResult = await client.query(pagoQuery, [turno_id, monto, metodo, cajaId]);
            const pago = pagoResult.rows[0];

            // 2. Actualizar estado del turno si es necesario
            // Primero obtenemos el turno para saber el total
            const turnoQuery = `
                SELECT t.monto_total, c.tipo as cancha_tipo 
                FROM turnos t
                JOIN canchas c ON t.cancha_id = c.id
                WHERE t.id = $1
            `;
            const turnoResult = await client.query(turnoQuery, [turno_id]);
            const turno = turnoResult.rows[0];

            // Calcular total pagado para este turno
            const totalPagadoQuery = 'SELECT SUM(monto) as total FROM pagos WHERE turno_id = $1';
            const totalPagadoResult = await client.query(totalPagadoQuery, [turno_id]);
            const totalPagado = parseFloat(totalPagadoResult.rows[0].total || 0);

            if (totalPagado >= parseFloat(turno.monto_total)) {
                await client.query('UPDATE turnos SET pagado = TRUE WHERE id = $1', [turno_id]);
            }

            await client.query('COMMIT');
            return pago;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    async getByTurno(turnoId) {
        const query = 'SELECT * FROM pagos WHERE turno_id = $1 ORDER BY fecha_pago DESC';
        const result = await pool.query(query, [turnoId]);
        return result.rows;
    }
};

module.exports = PagoModel;
