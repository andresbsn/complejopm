const pool = require('../config/db');
const { DomainError, money, method } = require('../utils/financial');

const VentaModel = {
    // Crear una nueva venta con sus detalles
    async create(ventaData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Obtener caja abierta
            const { items, total, usuario_id, observaciones, caja_id } = ventaData;
            if (!caja_id) throw new DomainError('Caja requerida', 409);
            const cajaRes = await client.query("SELECT id FROM cajas WHERE id=$1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
            if (!cajaRes.rows.length) throw new DomainError('La caja no está abierta', 409);
            if (!Array.isArray(items) || !items.length) throw new DomainError('Debe informar items');
            const totalAmount = money(total, 'total');
            let { pagos } = ventaData;

            // Backward compatibility / Single payment handling
            if (!pagos || pagos.length === 0) {
                const { metodo_pago, jugador_id } = ventaData; // Legacy fields
                pagos = [{
                    metodo: metodo_pago,
                    monto: totalAmount,
                    jugador_id: jugador_id
                }];
            }

            // Determine aggregate method name for the sale record
            if (!Array.isArray(pagos) || !pagos.length) throw new DomainError('Debe informar pagos');
            pagos = pagos.map(p => ({ ...p, monto: money(p.monto), metodo: method(p.metodo) }));
            if (pagos.some(p => p.metodo === 'cuenta_corriente' && !p.jugador_id)) throw new DomainError('Se requiere jugador_id para pago con cuenta corriente');
            if (Math.abs(pagos.reduce((s, p) => s + p.monto, 0) - totalAmount) > 0.005) throw new DomainError('La suma de pagos debe coincidir con el total', 409);
            const metodo_pago_global = pagos.length > 1 ? 'multiple' : pagos[0].metodo;

            // 1. Insertar la venta
            const ventaQuery = `
                INSERT INTO ventas_cantina (total, metodo_pago, caja_id, observaciones)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const ventaResult = await client.query(ventaQuery, [totalAmount, metodo_pago_global, caja_id, observaciones]);
            const venta = ventaResult.rows[0];

            // 1.5 Procesar pagos
            for (const pago of pagos) {
                // Insertar en pagos_ventas
                await client.query(`
                    INSERT INTO pagos_ventas (venta_id, metodo, monto)
                    VALUES ($1, $2, $3)
                `, [venta.id, pago.metodo, pago.monto]);

                // Si es cuenta corriente, registrar movimiento en cuenta del jugador
                if (pago.metodo === 'cuenta_corriente') {
                    if (!pago.jugador_id) throw new Error('Se requiere jugador_id para pago con cuenta corriente');

                    const movimientoQuery = `
                    INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id, referencia_tipo)
                    VALUES ($1, 'DEBE', $2, $3, $4, $5, 'venta_cantina')
                    `;
                    await client.query(movimientoQuery, [
                        pago.jugador_id,
                        pago.monto,
                        `Compra en Cantina (Venta #${venta.id})`,
                        venta.id,
                        caja_id
                    ]);
                }
            }

            let costoTotalVenta = 0;
            let totalItems = 0;

            // 2. Insertar detalles y actualizar stock
            for (const item of items) {
                const { producto_id, cantidad, precio_unitario } = item;
                if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0 || !Number.isFinite(Number(precio_unitario)) || Number(precio_unitario) < 0) throw new DomainError('Item inválido');

                // Validar stock y obtener costo
                const prodQuery = 'SELECT stock, costo, COALESCE(precio_venta, precio) AS precio FROM productos WHERE id = $1 FOR UPDATE';
                const prodResult = await client.query(prodQuery, [producto_id]);

                if (prodResult.rows.length === 0) {
                    throw new Error(`Producto ${producto_id} no encontrado`);
                }

                const product = prodResult.rows[0];
                const currentStock = product.stock;
                const costoUnitario = parseFloat(product.costo || 0);
                const precioServidor = Number(product.precio);
                if (!Number.isFinite(precioServidor) || precioServidor < 0) throw new DomainError(`El producto ${producto_id} no tiene un precio válido`, 409);

                if (currentStock < cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${producto_id}`);
                }

                costoTotalVenta += (costoUnitario * cantidad);

                // Insertar detalle
                const detalleQuery = `
                    INSERT INTO detalle_venta_cantina (venta_id, producto_id, cantidad, precio_unitario, subtotal, costo_unitario)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                const subtotal = Number(cantidad) * precioServidor;
                totalItems += subtotal;
                await client.query(detalleQuery, [venta.id, producto_id, cantidad, precioServidor, subtotal, costoUnitario]);

                // Actualizar stock
                const updateStockQuery = `
                    UPDATE productos
                    SET stock = stock - $1
                    WHERE id = $2
                `;
                await client.query(updateStockQuery, [cantidad, producto_id]);
            }

            if (Math.abs(totalItems - totalAmount) > 0.005) {
                throw new DomainError('La suma de los items debe coincidir con el total', 409);
            }

            // Registrar como costo interno la proporción cubierta por cortesía.
            const cortesia = pagos.filter(p => p.metodo === 'gastos_generales').reduce((s, p) => s + p.monto, 0);
            const costoCortesia = Math.round(costoTotalVenta * (cortesia / totalAmount) * 100) / 100;
            if (costoCortesia > 0) {
                const gastoQuery = `
                    INSERT INTO gastos (descripcion, monto, caja_id, usuario_id, metodo_pago, venta_id)
                    VALUES ($1, $2, $3, $4, 'gastos_generales', $5)
                `;
                await client.query(gastoQuery, [
                    `Cortesía/Gasto Cantina (Venta #${venta.id})`,
                    costoCortesia,
                    caja_id,
                    usuario_id,
                    venta.id
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
            conditions.push(`fecha::date >= $${values.length + 1}`);
            values.push(fechaDesde);
        }

        if (fechaHasta) {
            conditions.push(`fecha::date <= $${values.length + 1}`);
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
    },

    // Generar Nota de Crédito (Anular venta)
    async generarNotaCredito(ventaId, usuarioId, cajaId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 0. Comprobar la caja explícita tomada por el middleware.
            if (!cajaId) throw new DomainError('Caja requerida', 409);
            const cajaRes = await client.query("SELECT id FROM cajas WHERE id = $1 AND estado = 'abierta' FOR UPDATE", [cajaId]);
            if (!cajaRes.rows.length) throw new DomainError('La caja no está abierta', 409);

            // 1. Obtener la venta original
            const ventaRes = await client.query('SELECT * FROM ventas_cantina WHERE id = $1', [ventaId]);
            if (ventaRes.rows.length === 0) throw new Error('Venta no encontrada');
            const venta = ventaRes.rows[0];

            // Verificar si ya tiene nota de crédito o si ya fue anulada
            const ncCheck = await client.query('SELECT id FROM ventas_cantina WHERE observaciones = $1 OR observaciones LIKE $2', [
                `Nota de Crédito Venta #${ventaId}`,
                `%NC Venta #${ventaId}%`
            ]);
            if (ncCheck.rows.length > 0) throw new Error('Esta venta ya tiene una nota de crédito o fue anulada');

            // También verificar que no estemos intentando hacer nota de crédito de una nota de crédito
            if (venta.observaciones && venta.observaciones.includes('Nota de Crédito')) {
                throw new Error('No se puede generar una nota de crédito de otra nota de crédito');
            }

            // 2. Insertar Venta Negativa (Nota de Crédito)
            const ncQuery = `
                INSERT INTO ventas_cantina (total, metodo_pago, caja_id, observaciones)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const ncResult = await client.query(ncQuery, [
                -parseFloat(venta.total),
                venta.metodo_pago,
                cajaId,
                `Nota de Crédito Venta #${ventaId}`
            ]);
            const nc = ncResult.rows[0];

            // 3. Obtener y revertir pagos
            const pagosRes = await client.query('SELECT * FROM pagos_ventas WHERE venta_id = $1', [ventaId]);
            for (const pago of pagosRes.rows) {
                await client.query(`
                    INSERT INTO pagos_ventas (venta_id, metodo, monto)
                    VALUES ($1, $2, $3)
                `, [nc.id, pago.metodo, -parseFloat(pago.monto)]);

            }

            // Revertir cada deuda original exactamente una vez. Esto conserva el
            // jugador y monto correctos incluso si una venta usó varias cuentas.
            const deudasRes = await client.query(`
                SELECT id, jugador_id, monto
                FROM movimientos_cuenta
                WHERE referencia_id = $1
                  AND tipo = 'DEBE'
                  AND (
                      referencia_tipo = 'venta_cantina'
                      OR (
                          referencia_tipo IS NULL
                          AND descripcion LIKE '%Venta #%'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM movimientos_cuenta tipado
                              WHERE tipado.referencia_id = $1
                                AND tipado.tipo = 'DEBE'
                                AND tipado.referencia_tipo = 'venta_cantina'
                          )
                      )
                  )
                ORDER BY id
                FOR UPDATE
            `, [venta.id]);
            for (const deuda of deudasRes.rows) {
                await client.query(`
                    INSERT INTO movimientos_cuenta (jugador_id, tipo, monto, descripcion, referencia_id, caja_id, referencia_tipo)
                    VALUES ($1, 'HABER', $2, $3, $4, $5, 'venta_cantina')
                `, [deuda.jugador_id, deuda.monto, `Anulación Venta #${venta.id} (NC)`, nc.id, cajaId]);
            }

            // 4. Obtener detalles, revertir stock y subtotal
            const detallesRes = await client.query('SELECT * FROM detalle_venta_cantina WHERE venta_id = $1', [ventaId]);
            for (const item of detallesRes.rows) {
                const prodRes = await client.query('SELECT costo FROM productos WHERE id = $1', [item.producto_id]);
                const costoActual = prodRes.rows.length > 0 ? parseFloat(prodRes.rows[0].costo || 0) : 0;
                const costoOriginal = item.costo_unitario === null || item.costo_unitario === undefined
                    ? costoActual
                    : parseFloat(item.costo_unitario);

                // Insertar detalle negativo
                await client.query(`
                    INSERT INTO detalle_venta_cantina (venta_id, producto_id, cantidad, precio_unitario, subtotal, costo_unitario)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    nc.id,
                    item.producto_id,
                    -parseInt(item.cantidad),
                    parseFloat(item.precio_unitario),
                    -parseFloat(item.subtotal),
                    costoOriginal
                ]);

                // Devolver stock al producto
                await client.query(`
                    UPDATE productos
                    SET stock = stock + $1
                    WHERE id = $2
                `, [parseInt(item.cantidad), item.producto_id]);
            }

            // 5. Revertir el gasto exacto generado por cualquier componente de
            // cortesía (total o mixto), sin recalcularlo con costos actuales.
            const gastoOriginalRes = await client.query(`
                SELECT COALESCE(SUM(monto), 0) AS monto
                FROM gastos
                WHERE monto > 0
                  AND (
                      venta_id = $1
                      OR (
                          venta_id IS NULL
                          AND descripcion = $2
                          AND NOT EXISTS (SELECT 1 FROM gastos WHERE venta_id = $1)
                      )
                  )
            `, [ventaId, `Cortesía/Gasto Cantina (Venta #${ventaId})`]);
            const gastoOriginal = Number(gastoOriginalRes.rows[0].monto || 0);
            if (gastoOriginal > 0) {
                await client.query(`
                     INSERT INTO gastos (descripcion, monto, caja_id, usuario_id, metodo_pago, venta_id)
                     VALUES ($1, $2, $3, $4, 'gastos_generales', $5)
                 `, [
                    `Anulación Cortesía (Venta #${ventaId})`,
                    -gastoOriginal,
                    cajaId,
                    usuarioId || null,
                    nc.id
                ]);
            }

            await client.query('COMMIT');
            return nc;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
};

module.exports = VentaModel;
