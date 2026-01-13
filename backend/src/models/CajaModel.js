const pool = require('../config/db');

const CajaModel = {
    async abrir(usuario_id, saldo_inicial) {
        const abierta = await this.getAbierta();
        if (abierta) throw new Error('Ya existe una caja abierta');

        const query = `
            INSERT INTO cajas (fecha_apertura, saldo_inicial, estado, usuario_apertura_id)
            VALUES (CURRENT_TIMESTAMP, $1, 'abierta', $2)
            RETURNING *
        `;
        const res = await pool.query(query, [saldo_inicial, usuario_id]);
        return res.rows[0];
    },

    async cerrar(id, saldo_final, usuario_id) {
        const query = `
            UPDATE cajas 
            SET fecha_cierre = CURRENT_TIMESTAMP, saldo_final = $1, estado = 'cerrada', usuario_cierre_id = $2
            WHERE id = $3
            RETURNING *
        `;
        const res = await pool.query(query, [saldo_final, usuario_id, id]);
        return res.rows[0];
    },

    async getAbierta() {
        const query = "SELECT * FROM cajas WHERE estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1";
        const res = await pool.query(query);
        return res.rows[0];
    },

    async getById(id) {
        const query = "SELECT * FROM cajas WHERE id = $1";
        const res = await pool.query(query, [id]);
        return res.rows[0];
    },

    async getUltimaCerrada() {
        const query = "SELECT * FROM cajas WHERE estado = 'cerrada' ORDER BY fecha_cierre DESC LIMIT 1";
        const res = await pool.query(query);
        return res.rows[0];
    },

    async getTodas() {
        const query = "SELECT * FROM cajas ORDER BY fecha_apertura DESC";
        const res = await pool.query(query);
        return res.rows;
    },

    async getMovimientos(cajaId) {
        const query = `
            SELECT 'VENTA' as tipo_movimiento, fecha, 'Venta Cantina #' || id as descripcion, total as monto, metodo_pago
            FROM ventas_cantina WHERE caja_id = $1
            UNION ALL
            SELECT 'PAGO_TURNO' as tipo_movimiento, fecha_pago as fecha, 'Pago Turno #' || turno_id as descripcion, monto, metodo as metodo_pago
            FROM pagos WHERE caja_id = $1
            UNION ALL
            SELECT 'INSCRIPCION' as tipo_movimiento, fecha_pago as fecha, 'Inscripción Torneo', monto_abonado as monto, metodo_pago
            FROM inscripciones WHERE caja_id = $1
            UNION ALL
            SELECT 'INGRESO_CUENTA' as tipo_movimiento, fecha, descripcion, monto, 'N/A' as metodo_pago
            FROM movimientos_cuenta WHERE caja_id = $1 AND tipo = 'HABER'
            UNION ALL
            SELECT 'GASTO' as tipo_movimiento, fecha, descripcion, -monto as monto, 'Efectivo' as metodo_pago
            FROM gastos WHERE caja_id = $1
            ORDER BY fecha DESC
        `;
        const res = await pool.query(query, [cajaId]);
        return res.rows;
    }
};

module.exports = CajaModel;
