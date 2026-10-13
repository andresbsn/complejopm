const pool = require('../config/db');
const { DomainError } = require('../utils/financial');

const CuentaModel = {
    // Obtener historial de movimientos de un jugador
    async getByJugador(jugadorId) {
        const query = `
            SELECT * FROM movimientos_cuenta 
            WHERE jugador_id = $1 
            ORDER BY fecha DESC
        `;
        const result = await pool.query(query, [jugadorId]);
        return result.rows;
    },

    async addMovimiento(movimiento, client = null) {
        const { jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago } = movimiento;
        const query = `
            INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        if (client) {
            if (caja_id) {
                const caja = await client.query("SELECT id FROM cajas WHERE id = $1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
                if (!caja.rows.length) throw new DomainError('La caja no está abierta', 409);
            }
            const result = await client.query(query, [jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago]);
            return result.rows[0];
        }

        const ownClient = await pool.connect();
        try {
            await ownClient.query('BEGIN');
            if (caja_id) {
                const caja = await ownClient.query("SELECT id FROM cajas WHERE id = $1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
                if (!caja.rows.length) throw new DomainError('La caja no está abierta', 409);
            }
            const result = await ownClient.query(query, [jugador_id, tipo, monto, descripcion, referencia_id, caja_id, metodo_pago]);
            await ownClient.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await ownClient.query('ROLLBACK');
            throw error;
        } finally {
            ownClient.release();
        }
    },

    // Obtener saldo actual de un jugador
    async getSaldo(jugadorId) {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN tipo = 'DEBE' THEN monto ELSE -monto END), 0) as saldo
            FROM movimientos_cuenta
            WHERE jugador_id = $1
        `;
        const result = await pool.query(query, [jugadorId]);
        return parseFloat(result.rows[0].saldo) || 0;
    }
};

module.exports = CuentaModel;
