const pool = require('../config/db');

const VentaModel = {
    // Crear una nueva venta con sus detalles
    async create(ventaData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Obtener caja abierta
            const cajaRes = await client.query("SELECT id FROM cajas WHERE estado = 'abierta' LIMIT 1");
            const cajaId = cajaRes.rows.length > 0 ? cajaRes.rows[0].id : null;

            const { items, total, metodo_pago, jugador_id, observaciones, usuario_id } = ventaData;

            // 1. Insertar la venta
            // Nota: Si método de pago es cuenta_corriente, registramos la venta igual.
            const ventaQuery = `
                INSERT INTO ventas_cantina (total, metodo_pago, caja_id, observaciones)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const ventaResult = await client.query(ventaQuery, [total, metodo_pago, cajaId, observaciones]);
            const venta = ventaResult.rows[0];

            // 1.5 Si es cuenta corriente, registrar movimiento en cuenta del jugador
            if (metodo_pago === 'cuenta_corriente') {
                if (!jugador_id) throw new Error('Se requiere jugador_id para cuenta corriente');

                const movimientoQuery = `
                    INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id)
                    VALUES ($1, 'DEBE', $2, $3, $4)
                `;
                await client.query(movimientoQuery, [
                    jugador_id,
                    total,
                    `Compra en Cantina (Venta #${venta.id})`,
                    venta.id
                ]);
            }

            let costoTotalVenta = 0;

            // 2. Insertar detalles y actualizar stock
            for (const item of items) {
                const { producto_id, cantidad, precio_unitario } = item;

                // Validar stock y obtener costo
                const prodQuery = 'SELECT stock, costo FROM productos WHERE id = $1 FOR UPDATE';
                const prodResult = await client.query(prodQuery, [producto_id]);

                if (prodResult.rows.length === 0) {
                    throw new Error(`Producto ${producto_id} no encontrado`);
                }

                const product = prodResult.rows[0];
                const currentStock = product.stock;
                const costoUnitario = parseFloat(product.costo || 0);

                if (currentStock < cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${producto_id}`);
                }

                costoTotalVenta += (costoUnitario * cantidad);

                // Insertar detalle
                const detalleQuery = `
                    INSERT INTO detalle_venta_cantina (venta_id, producto_id, cantidad, precio_unitario, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                const subtotal = cantidad * precio_unitario;
                await client.query(detalleQuery, [venta.id, producto_id, cantidad, precio_unitario, subtotal]);

                // Actualizar stock
                const updateStockQuery = `
                    UPDATE productos
                    SET stock = stock - $1
                    WHERE id = $2
                `;
                await client.query(updateStockQuery, [cantidad, producto_id]);
            }

            // 3. Si es cortesía/gasto general, generar un gasto por el COSTO de los productos
            if (metodo_pago === 'gastos_generales') {
                const gastoQuery = `
                    INSERT INTO gastos (descripcion, monto, caja_id, usuario_id)
                    VALUES ($1, $2, $3, $4)
                `;
                await client.query(gastoQuery, [
                    `Cortesía/Gasto Cantina (Venta #${venta.id})`,
                    costoTotalVenta,
                    cajaId,
                    usuario_id
                ]);
            }

            await client.query('COMMIT');
            return venta;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // Obtener todas las ventas
    async getAll(fechaDesde, fechaHasta) {
        let query = 'SELECT * FROM ventas_cantina';
        const values = [];
        const conditions = [];

        if (fechaDesde) {
            conditions.push(`(fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= $${values.length + 1}`);
            values.push(fechaDesde);
        }

        if (fechaHasta) {
            conditions.push(`(fecha AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::date <= $${values.length + 1}`);
            values.push(fechaHasta);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY fecha DESC';

        const result = await pool.query(query, values);
        return result.rows;
    },

    // Obtener detalles de una venta
    async getDetalles(ventaId) {
        const query = `
            SELECT dv.*, p.nombre as producto_nombre
            FROM detalle_venta_cantina dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = $1
        `;
        const result = await pool.query(query, [ventaId]);
        return result.rows;
    }
};

module.exports = VentaModel;
