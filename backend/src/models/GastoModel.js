const pool = require('../config/db');
const { DomainError, MONETARY_METHODS, money, method } = require('../utils/financial');

const GastoModel = {
    async create(data) {
        const { descripcion, monto, caja_id, usuario_id, metodo_pago } = data;
        if (!descripcion || !String(descripcion).trim()) throw new DomainError('Descripción requerida');
        const amount = money(monto);
        method(metodo_pago);
        if (!MONETARY_METHODS.has(metodo_pago)) throw new DomainError('El gasto requiere un método de pago monetario');
        if (!caja_id) throw new DomainError('Caja requerida', 409);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const caja = await client.query("SELECT id FROM cajas WHERE id = $1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
            if (!caja.rows.length) throw new DomainError('La caja no está abierta', 409);
            const query = `
                INSERT INTO gastos (descripcion, monto, caja_id, usuario_id, metodo_pago)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const res = await client.query(query, [String(descripcion).trim(), amount, caja_id, usuario_id, metodo_pago]);
            await client.query('COMMIT');
            return res.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async getAll() {
        // Order by fecha descending by default
        const query = `
            SELECT g.*, u.nombre as usuario_nombre 
            FROM gastos g
            LEFT JOIN usuarios u ON g.usuario_id = u.id
            ORDER BY g.fecha DESC
        `;
        const res = await pool.query(query);
        return res.rows;
    },

    async delete(id) {
        const query = `
            DELETE FROM gastos g
            WHERE g.id = $1
              AND (
                  g.caja_id IS NULL
                  OR EXISTS (SELECT 1 FROM cajas c WHERE c.id = g.caja_id AND c.estado = 'abierta')
              )
            RETURNING g.*
        `;
        const res = await pool.query(query, [id]);
        if (!res.rows.length) {
            const exists = await pool.query('SELECT g.id, c.estado FROM gastos g LEFT JOIN cajas c ON c.id = g.caja_id WHERE g.id = $1', [id]);
            if (exists.rows.length && exists.rows[0].estado === 'cerrada') throw new DomainError('No se puede borrar un gasto de una caja cerrada', 409);
        }
        return res.rows[0];
    }
};

module.exports = GastoModel;
