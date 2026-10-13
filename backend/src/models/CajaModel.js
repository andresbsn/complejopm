const pool = require('../config/db');
const { DomainError, nonNegativeMoney } = require('../utils/financial');

const CajaModel = {
    async abrir(usuario_id, saldo_inicial) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SELECT pg_advisory_xact_lock(8675309)');
            const abierta = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' FOR UPDATE");
            if (abierta.rows.length) throw new DomainError('Ya existe una caja abierta', 409);
            const query = `
            INSERT INTO cajas (fecha_apertura, saldo_inicial, estado, usuario_apertura_id)
            VALUES (CURRENT_TIMESTAMP, $1, 'abierta', $2)
            RETURNING *
        `;
            const res = await client.query(query, [nonNegativeMoney(saldo_inicial, 'saldo inicial'), usuario_id]);
            await client.query('COMMIT'); return res.rows[0];
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    },

    async cerrar(id, saldo_final, usuario_id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const query = `
            UPDATE cajas 
            SET fecha_cierre = CURRENT_TIMESTAMP, saldo_final = $1, estado = 'cerrada', usuario_cierre_id = $2
            WHERE id = $3 AND estado = 'abierta'
            RETURNING *
        `;
            const res = await client.query(query, [nonNegativeMoney(saldo_final, 'saldo final'), usuario_id, id]);
            if (!res.rows.length) {
                const exists = await client.query('SELECT id, estado FROM cajas WHERE id = $1', [id]);
                if (!exists.rows.length) throw new DomainError('Caja no encontrada', 404);
                throw new DomainError('La caja ya está cerrada', 409);
            }
            await client.query('COMMIT'); return res.rows[0];
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
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

        // La asociación explícita por caja_id es autoritativa. El rango temporal
        // se conserva únicamente para filas históricas que no tienen caja_id.
        const query = `
            SELECT 
                'VENTA' as tipo_movimiento, 
                v.id as referencia_id, 
                v.fecha, 
                CASE WHEN p.metodo = 'gastos_generales' THEN 'Cortesía/Gasto Cantina' ELSE 'Venta Cantina' END || COALESCE(' (' || v.observaciones || ')', '') as descripcion, 
                CASE WHEN p.metodo = 'gastos_generales' THEN 0 ELSE p.monto END as monto, 
                p.metodo as metodo_pago,
                NULL as cliente_nombre
            FROM ventas_cantina v
            JOIN pagos_ventas p ON v.id = p.venta_id
            WHERE (v.caja_id = $3 OR (v.caja_id IS NULL AND v.fecha >= $1 AND ($2::timestamp IS NULL OR v.fecha <= $2::timestamp)))
            AND p.metodo <> 'gastos_generales'
            UNION ALL
            SELECT 
                'PAGO_TURNO' as tipo_movimiento, 
                p.turno_id as referencia_id, 
                p.fecha_pago as fecha, 
                'Turno ' || c.tipo || ' - ' || c.nombre || ' (' || SUBSTRING(t.hora_inicio::text, 1, 5) || 'hs)' as descripcion, 
                CASE WHEN p.metodo = 'gastos_generales' THEN 0 ELSE p.monto END, 
                p.metodo as metodo_pago,
                t.cliente_nombre
            FROM pagos p
            JOIN turnos t ON p.turno_id = t.id
            JOIN canchas c ON t.cancha_id = c.id
            WHERE (p.caja_id = $3 OR (p.caja_id IS NULL AND p.fecha_pago >= $1 AND ($2::timestamp IS NULL OR p.fecha_pago <= $2::timestamp)))
            UNION ALL
            SELECT 'INSCRIPCION' as tipo_movimiento, p.id as referencia_id, p.fecha_pago as fecha, 'Inscripción Torneo' || ' - ' || t.descripcion as descripcion, p.monto as monto, p.metodo as metodo_pago, j.nombre as cliente_nombre
            FROM pagos_inscripcion p
            JOIN inscripciones i ON p.inscripcion_id = i.id
            JOIN torneos t ON i.torneo_id = t.id
            JOIN jugadores j ON i.jugador_id = j.id
            WHERE (p.caja_id = $3 OR (p.caja_id IS NULL AND p.fecha_pago >= $1 AND ($2::timestamp IS NULL OR p.fecha_pago <= $2::timestamp)))
            UNION ALL
            SELECT 'INGRESO_CUENTA' as tipo_movimiento, m.id as referencia_id, m.fecha, m.descripcion, m.monto, COALESCE(m.metodo_pago, 'CC') as metodo_pago, j.nombre as cliente_nombre
            FROM movimientos_cuenta m
            LEFT JOIN jugadores j ON m.jugador_id = j.id
            WHERE m.tipo = 'HABER' AND (m.caja_id = $3 OR (m.caja_id IS NULL AND m.fecha >= $1 AND ($2::timestamp IS NULL OR m.fecha <= $2::timestamp)))
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
                 COALESCE(metodo_pago, CASE WHEN descripcion LIKE '%Cortesía%' THEN 'Cortesía' ELSE 'Efectivo' END) as metodo_pago,
                NULL as cliente_nombre
            FROM gastos 
            WHERE (caja_id = $3 OR (caja_id IS NULL AND fecha >= $1 AND ($2::timestamp IS NULL OR fecha <= $2::timestamp)))
            ORDER BY fecha DESC
        `;
        const res = await pool.query(query, [fecha_apertura, fecha_cierre, cajaId]);
        return res.rows;
    }
};

module.exports = CajaModel;
