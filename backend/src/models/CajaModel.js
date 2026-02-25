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
        // 1. Obtener rango de fechas de la caja
        const cajaQuery = "SELECT fecha_apertura, fecha_cierre FROM cajas WHERE id = $1";
        const cajaRes = await pool.query(cajaQuery, [cajaId]);

        if (cajaRes.rows.length === 0) return [];

        const { fecha_apertura, fecha_cierre } = cajaRes.rows[0];

        // 2. Buscar movimientos por FECHA en lugar de por ID de caja
        // Esto corrige el problema de movimientos "huérfanos" o mal asignados,
        // asegurando que el reporte muestre todo lo que pasó mientras la caja estaba abierta.
        const query = `
            SELECT 
                'VENTA' as tipo_movimiento, 
                v.id as referencia_id, 
                v.fecha, 
                CASE WHEN p.metodo = 'gastos_generales' THEN 'Cortesía/Gasto Cantina' ELSE 'Venta Cantina' END || COALESCE(' (' || v.observaciones || ')', '') as descripcion, 
                CASE WHEN p.metodo = 'gastos_generales' THEN 0 ELSE p.monto END as monto, 
                p.metodo as metodo_pago
            FROM ventas_cantina v
            JOIN pagos_ventas p ON v.id = p.venta_id
            WHERE v.fecha >= $1 AND ($2::timestamp IS NULL OR v.fecha <= $2::timestamp)
            AND p.metodo <> 'gastos_generales'
            UNION ALL
            SELECT 'PAGO_TURNO' as tipo_movimiento, turno_id as referencia_id, fecha_pago as fecha, 'Pago Turno' || COALESCE(' (' || observaciones || ')', '') as descripcion, CASE WHEN metodo = 'gastos_generales' THEN 0 ELSE monto END, metodo as metodo_pago
            FROM pagos 
            WHERE fecha_pago >= $1 AND ($2::timestamp IS NULL OR fecha_pago <= $2::timestamp)
            UNION ALL
            SELECT 'INSCRIPCION' as tipo_movimiento, id as referencia_id, fecha_pago as fecha, 'Inscripción Torneo', monto_abonado as monto, metodo_pago
            FROM inscripciones 
            WHERE fecha_pago >= $1 AND ($2::timestamp IS NULL OR fecha_pago <= $2::timestamp)
            UNION ALL
            SELECT 'INGRESO_CUENTA' as tipo_movimiento, id as referencia_id, fecha, descripcion, monto, 'CC' as metodo_pago
            FROM movimientos_cuenta 
            WHERE tipo = 'HABER' AND fecha >= $1 AND ($2::timestamp IS NULL OR fecha <= $2::timestamp)
            UNION ALL
            SELECT 
                'GASTO' as tipo_movimiento, 
                CASE 
                    WHEN descripcion LIKE '%(Venta #%)%' THEN (substring(descripcion from 'Venta #([0-9]+)'))::int 
                    ELSE id 
                END as referencia_id, 
                fecha, 
                descripcion, 
                -monto as monto, 
                CASE WHEN descripcion LIKE '%Cortesía%' THEN 'Cortesía' ELSE 'Efectivo' END as metodo_pago
            FROM gastos 
            WHERE fecha >= $1 AND ($2::timestamp IS NULL OR fecha <= $2::timestamp)
            ORDER BY fecha DESC
        `;
        const res = await pool.query(query, [fecha_apertura, fecha_cierre]);
        return res.rows;
    }
};

module.exports = CajaModel;
