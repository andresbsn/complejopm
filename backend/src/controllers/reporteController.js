const pool = require('../config/db');

const reporteController = {
    getVentasReport: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta, tipo, metodoPago } = req.query;

            let finalQuery = `
                SELECT * FROM (
                    SELECT id, fecha, 'VENTA' as tipo, 'Venta Cantina #' || id as descripcion, metodo_pago as metodo, total as monto FROM ventas_cantina
                    UNION ALL
                    SELECT 
                        p.id, 
                        p.fecha_pago as fecha, 
                        'RESERVA' as tipo, 
                        'Pago Turno ' || CASE WHEN c.tipo = 'PADEL' THEN 'Padel' ELSE 'Fútbol' END || ' ' || c.nombre as descripcion, 
                        p.metodo, 
                        p.monto 
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
                        i.monto_abonado as monto
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
                finalQuery += ` AND metodo = $${paramCounter}`;
                finalParams.push(metodoPago);
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
    }
};

module.exports = reporteController;
