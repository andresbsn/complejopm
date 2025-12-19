const pool = require('../config/db');

const reporteController = {
    getVentasReport: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta, tipo, metodoPago } = req.query;

            let params = [];
            let whereClauseVentas = [];
            let whereClausePagos = [];

            // Base queries
            // Venas Cantina
            let queryVentas = `
                SELECT 
                    id, 
                    fecha as fecha, 
                    'VENTA' as tipo, 
                    'Venta Cantina #' || id as descripcion, 
                    metodo_pago as metodo, 
                    total as monto 
                FROM ventas_cantina
            `;

            // Pagos Reservas
            let queryPagos = `
                SELECT 
                    id, 
                    fecha_pago as fecha, 
                    'RESERVA' as tipo, 
                    'Pago Reserva Turno #' || turno_id as descripcion, 
                    metodo, 
                    monto 
                FROM pagos
            `;

            // Date Filters
            // Note: We need careful parameter mapping if we use separate queries or a UNION.
            // UNION approach with Common Table Expressions (CTE) or subqueries is best.

            // Let's build a UNION ALL query dynamically.

            let commonConditions = [];
            let values = [];
            let counter = 1;

            if (fechaDesde) {
                commonConditions.push(`fecha >= $${counter}`);
                values.push(fechaDesde);
                counter++;
            }
            if (fechaHasta) {
                // Ensure end of day if it's just a date, or rely on client sending timestamp.
                // Assuming client sends YYYY-MM-DD or ISO.
                commonConditions.push(`fecha <= $${counter}`);
                values.push(fechaHasta);
                counter++;
            }

            // Apply condition string
            const applyConditions = (baseQuery, conditions) => {
                if (conditions.length > 0) {
                    return `${baseQuery} WHERE ${conditions.join(' AND ')}`;
                }
                return baseQuery;
            };

            // Wrapped queries to apply alias 'fecha' correctly for filtering if needed, 
            // but effectively we filter inside the subqueries using the mapped column.

            // However, it's easier to filter the result of the union if we want shared logic, 
            // BUT for performance it's better to filter inside.

            // Re-constructing for parametrized safety:

            let ventasConditions = [...commonConditions];
            let pagosConditions = [...commonConditions.map(c => c.replace('fecha', 'fecha_pago').replace('fecha_pago', 'fecha'))]; // Hacky replacement?
            // Wait, standard SQL param placeholder $1 works fine. The column name differs.

            // Let's manually build the string for each.
            let ventasWhere = [];
            let pagosWhere = [];

            let valuesVentas = []; // We can't easily share params across UNION parts in pg node driver unless we concat the string?
            // Actually we can pass one array of values if we use the same indices.

            // Simpler approach: Fetch both arrays separately using the params, then merge in JS.
            // Unless pagination is needed (not requested yet), JS merge is fine for report size.
            // If data is huge, SQL UNION is better. Let's do SQL UNION for correctness.

            /*
            SELECT id, fecha, tipo, descripcion, metodo, monto FROM (
                SELECT id, fecha, 'VENTA' as tipo, 'Venta Cantina #' || id as descripcion, metodo_pago as metodo, total as monto FROM ventas_cantina
                UNION ALL
                SELECT id, fecha_pago as fecha, 'RESERVA' as tipo, 'Pago Reserva Turno #' || turno_id as descripcion, metodo, monto FROM pagos
            ) as combined_reports
            WHERE 1=1
            AND (fecha >= $1 OR $1 IS NULL) 
            AND (fecha <= $2 OR $2 IS NULL)
            AND (tipo = $3 OR $3 IS NULL)
            AND (metodo = $4 OR $4 IS NULL)
            ORDER BY fecha DESC
            */

            const query = `
                SELECT * FROM (
                    SELECT id, fecha, 'VENTA' as tipo, 'Venta Cantina #' || id as descripcion, metodo_pago as metodo, total as monto FROM ventas_cantina
                    UNION ALL
                    SELECT id, fecha_pago as fecha, 'RESERVA' as tipo, 'Pago Reserva Turno #' || turno_id as descripcion, metodo, monto FROM pagos
                ) as combined
                WHERE 1=1
                ${fechaDesde ? `AND fecha >= $1` : ''}
                ${fechaHasta ? `AND fecha <= $2` : ''}
                ${tipo ? `AND tipo = $3` : ''}
                ${metodoPago ? `AND metodo = $4` : ''}
                ORDER BY fecha DESC
            `;

            // Prepare params array derived from checks
            let queryParams = [];
            if (fechaDesde) queryParams.push(fechaDesde);
            if (fechaHasta) queryParams.push(fechaHasta);
            if (tipo) queryParams.push(tipo);
            if (metodoPago) queryParams.push(metodoPago);

            // Need to fix indices in query string
            // Replace $1, $2, etc dynamically?
            // Or just build the query string with correct indices.

            let finalQuery = `
                SELECT * FROM (
                    SELECT id, fecha, 'VENTA' as tipo, 'Venta Cantina #' || id as descripcion, metodo_pago as metodo, total as monto FROM ventas_cantina
                    UNION ALL
                    SELECT id, fecha_pago as fecha, 'RESERVA' as tipo, 'Pago Reserva Turno #' || turno_id as descripcion, metodo, monto FROM pagos
                ) as combined
                WHERE 1=1
            `;

            let paramCounter = 1;
            let finalParams = [];

            if (fechaDesde) {
                finalQuery += ` AND fecha >= $${paramCounter}`;
                finalParams.push(fechaDesde);
                paramCounter++;
            }
            if (fechaHasta) {
                finalQuery += ` AND fecha <= $${paramCounter}`;
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
    }
};

module.exports = reporteController;
