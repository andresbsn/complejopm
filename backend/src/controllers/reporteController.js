const pool = require('../config/db');

const reporteController = {
    getVentasReport: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta, tipo, metodoPago, categoriaVenta } = req.query;

            let finalQuery = `
                SELECT * FROM (
                    SELECT 
                        v.id, 
                        v.fecha, 
                        'VENTA' as tipo, 
                        'Venta Cantina #' || v.id as descripcion, 
                        v.metodo_pago as metodo,
                        COALESCE((SELECT SUM(CASE WHEN pv.metodo = 'gastos_generales' THEN 0 ELSE pv.monto END)
                                  FROM pagos_ventas pv
                                  WHERE pv.venta_id = v.id),
                                 CASE WHEN v.metodo_pago = 'gastos_generales' THEN 0 ELSE v.total END) as monto,
                        (COALESCE((SELECT SUM(CASE WHEN pv.metodo = 'gastos_generales' THEN 0 ELSE pv.monto END)
                                   FROM pagos_ventas pv
                                   WHERE pv.venta_id = v.id),
                                  CASE WHEN v.metodo_pago = 'gastos_generales' THEN 0 ELSE v.total END) -
                            COALESCE((SELECT SUM(d.cantidad * COALESCE(d.costo_unitario, p.costo))
                                      FROM detalle_venta_cantina d 
                                      JOIN productos p ON d.producto_id = p.id 
                                      WHERE d.venta_id = v.id), 0)
                        ) as ganancia,
                        v.observaciones,
                        'cantina' as categoria_venta,
                        ARRAY(SELECT DISTINCT pv.metodo FROM pagos_ventas pv WHERE pv.venta_id = v.id) as metodos_pago
                    FROM ventas_cantina v
                    UNION ALL
                    SELECT 
                        p.id, 
                        p.fecha_pago as fecha, 
                        'RESERVA' as tipo, 
                        'Pago Turno ' || CASE WHEN c.tipo = 'PADEL' THEN 'Padel' ELSE 'Fútbol' END || ' ' || c.nombre as descripcion, 
                        p.metodo, 
                        p.monto,
                        p.monto as ganancia,
                        p.observaciones,
                        LOWER(c.tipo) as categoria_venta,
                        ARRAY[p.metodo]::text[] as metodos_pago
                    FROM pagos p
                    JOIN turnos t ON p.turno_id = t.id
                    JOIN canchas c ON t.cancha_id = c.id
                    UNION ALL
                    SELECT
                        i.id,
                        i.fecha_pago as fecha,
                        'INSCRIPCION' as tipo,
                        'Inscripción Torneo: ' || t.descripcion || ' - ' || j.nombre as descripcion,
                        i.metodo_pago as metodo,
                        i.monto_abonado as monto,
                        0 as ganancia,
                        NULL as observaciones,
                        'torneo' as categoria_venta,
                        ARRAY(SELECT DISTINCT pi.metodo FROM pagos_inscripcion pi WHERE pi.inscripcion_id = i.id) as metodos_pago
                    FROM inscripciones i
                    JOIN torneos t ON i.torneo_id = t.id
                    JOIN jugadores j ON i.jugador_id = j.id
                    WHERE i.pagado = TRUE
                ) as combined
                WHERE 1=1
            `;

            let paramCounter = 1;
            let finalParams = [];

            if (fechaDesde) {
                finalQuery += ` AND fecha::date >= $${paramCounter}`;
                finalParams.push(fechaDesde);
                paramCounter++;
            }
            if (fechaHasta) {
                finalQuery += ` AND fecha::date <= $${paramCounter}`;
                finalParams.push(fechaHasta);
                paramCounter++;
            }
            if (tipo) {
                finalQuery += ` AND tipo = $${paramCounter}`;
                finalParams.push(tipo);
                paramCounter++;
            }
            if (metodoPago) {
                finalQuery += ` AND (metodo = $${paramCounter} OR $${paramCounter} = ANY(metodos_pago))`;
                finalParams.push(metodoPago);
                paramCounter++;
            }
            if (categoriaVenta) {
                finalQuery += ` AND categoria_venta = $${paramCounter}`;
                finalParams.push(categoriaVenta);
                paramCounter++;
            }

            finalQuery += ` ORDER BY fecha DESC`;

            const result = await pool.query(finalQuery, finalParams);
            res.json(result.rows);

        } catch (error) {
            console.error('Error getting sales report:', error);
            res.status(500).json({ error: 'Error al generar reporte' });
        }
    },

    getJugadoresPorCategoria: async (req, res) => {
        try {
            const { categoria_id, search } = req.query;
            let query = `
                SELECT j.*, c.descripcion as categoria_descripcion,
                COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
                FROM jugadores j
                LEFT JOIN categorias c ON j.categoria_id = c.id
                LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
            `;

            let whereConditions = [];
            let params = [];
            let paramCounter = 1;

            if (categoria_id) {
                whereConditions.push(`j.categoria_id = $${paramCounter}`);
                params.push(categoria_id);
                paramCounter++;
            }

            if (search) {
                whereConditions.push(`j.nombre ILIKE $${paramCounter}`);
                params.push(`%${search}%`);
                paramCounter++;
            }

            if (whereConditions.length > 0) {
                query += ` WHERE ${whereConditions.join(' AND ')}`;
            }

            query += `
                GROUP BY j.id, c.descripcion
                ORDER BY c.descripcion ASC, j.nombre ASC
            `;

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting players by category report:', error);
            res.status(500).json({ error: 'Error al generar reporte de jugadores' });
        }
    },

    getDeudores: async (req, res) => {
        try {
            const query = `
                SELECT j.*, c.descripcion as categoria_descripcion,
                COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
                FROM jugadores j
                LEFT JOIN categorias c ON j.categoria_id = c.id
                LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
                GROUP BY j.id, c.descripcion
                HAVING COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) > 0
                ORDER BY saldo DESC
            `;
            const result = await pool.query(query);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting debtors report:', error);
            res.status(500).json({ error: 'Error al generar reporte de deudores' });
        }
    },

    getPadelStats: async (req, res) => {
        try {
            const today = new Date().toISOString().slice(0, 10);
            const fechaDesde = req.query.fechaDesde || `${today.slice(0, 8)}01`;
            const fechaHasta = req.query.fechaHasta || today;

            const baseCondition = `
                FROM turnos t
                JOIN canchas c ON c.id = t.cancha_id
                LEFT JOIN LATERAL (
                    SELECT GREATEST(
                        0,
                        LEAST(COALESCE(SUM(p.monto), 0), t.monto_total)
                    ) AS total_pagado
                    FROM pagos p
                    WHERE p.turno_id = t.id
                ) pagos ON TRUE
                WHERE LOWER(c.tipo) = 'padel'
                  AND t.estado <> 'cancelado'
                  AND t.fecha BETWEEN $1::date AND $2::date
            `;

            const [summary, courts, hours, weekdays, statuses] = await Promise.all([
                pool.query(`
                    SELECT
                        COUNT(*) FILTER (WHERE t.fecha = CURRENT_DATE) AS hoy,
                        COUNT(*) FILTER (WHERE t.fecha >= date_trunc('week', CURRENT_DATE)::date) AS semana,
                        COUNT(*) FILTER (WHERE t.fecha >= date_trunc('month', CURRENT_DATE)::date) AS mes,
                        COUNT(*) AS total_periodo,
                        COALESCE(SUM(pagos.total_pagado), 0) AS ingresos_periodo,
                        COALESCE(AVG(t.monto_total), 0) AS ticket_promedio,
                        COUNT(DISTINCT t.cliente_telefono) FILTER (WHERE t.cliente_telefono IS NOT NULL AND t.cliente_telefono <> '') AS clientes_unicos
                    ${baseCondition}
                `, [fechaDesde, fechaHasta]),
                pool.query(`
                    SELECT c.nombre, COUNT(*)::int AS cantidad, COALESCE(SUM(pagos.total_pagado), 0) AS ingresos
                    ${baseCondition}
                    GROUP BY c.id, c.nombre
                    ORDER BY cantidad DESC, c.nombre ASC
                `, [fechaDesde, fechaHasta]),
                pool.query(`
                    SELECT TO_CHAR(t.hora_inicio, 'HH24:MI') AS franja, COUNT(*)::int AS cantidad
                    ${baseCondition}
                    GROUP BY t.hora_inicio
                    ORDER BY cantidad DESC, t.hora_inicio ASC
                `, [fechaDesde, fechaHasta]),
                pool.query(`
                    SELECT EXTRACT(ISODOW FROM t.fecha)::int AS dia, COUNT(*)::int AS cantidad
                    ${baseCondition}
                    GROUP BY dia
                    ORDER BY dia ASC
                `, [fechaDesde, fechaHasta]),
                pool.query(`
                    SELECT t.estado, COUNT(*)::int AS cantidad
                    FROM turnos t
                    JOIN canchas c ON c.id = t.cancha_id
                    WHERE LOWER(c.tipo) = 'padel'
                      AND t.fecha BETWEEN $1::date AND $2::date
                    GROUP BY t.estado
                    ORDER BY cantidad DESC
                `, [fechaDesde, fechaHasta])
            ]);

            res.json({
                fechaDesde,
                fechaHasta,
                resumen: summary.rows[0],
                porCancha: courts.rows,
                porFranja: hours.rows,
                porDiaSemana: weekdays.rows,
                porEstado: statuses.rows
            });
        } catch (error) {
            console.error('Error getting padel statistics:', error);
            res.status(500).json({ error: 'Error al generar estadísticas de pádel' });
        }
    }
};

module.exports = reporteController;
