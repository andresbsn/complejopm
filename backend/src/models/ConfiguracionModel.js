const pool = require('../config/db');

const FIXED_PRICE_CONFIG = {
    PRECIO_PADEL_FIJO: 'padel',
    PRECIO_FUTBOL: 'futbol'
};

const ConfiguracionModel = {
    async getAll() {
        const result = await pool.query('SELECT * FROM configuracion');
        return result.rows;
    },

    async update(clave, valor, vigenciaDesde = null) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const result = await client.query(`
                INSERT INTO configuracion (clave, valor)
                VALUES ($1, $2)
                ON CONFLICT (clave)
                DO UPDATE SET valor = EXCLUDED.valor
                RETURNING *
            `, [clave, valor]);

            const tipoCancha = FIXED_PRICE_CONFIG[clave];
            if (tipoCancha) {
                const monto = Number(valor);
                if (!Number.isFinite(monto) || monto < 0) {
                    throw new Error('El precio debe ser un número mayor o igual a cero.');
                }

                await this.updateFixedPrices(client, tipoCancha, monto, vigenciaDesde);
            }

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async updateFixedPrices(client, tipoCancha, monto, vigenciaDesde = null) {
        const effectiveDate = vigenciaDesde ? new Date(vigenciaDesde) : null;
        if (effectiveDate && Number.isNaN(effectiveDate.getTime())) {
            throw new Error('La fecha de vigencia no es válida.');
        }

        const effectiveValue = effectiveDate ? effectiveDate.toISOString() : null;
        const effectiveExpression = effectiveDate
            ? '$3::timestamp without time zone'
            : 'CURRENT_TIMESTAMP';
        const currentExpression = effectiveDate
            ? '$2::timestamp without time zone'
            : 'CURRENT_TIMESTAMP';

        const seriesResult = await client.query(`
            SELECT rf.id
            FROM reservas_fijas rf
            JOIN canchas c ON c.id = rf.cancha_id
            WHERE LOWER(c.tipo) = $1
        `, [tipoCancha]);

        for (const series of seriesResult.rows) {
            const currentResult = await client.query(`
                SELECT id, monto_total
                FROM reservas_fijas_precios
                WHERE reserva_fija_id = $1
                  AND vigente_desde <= ${currentExpression}
                  AND (vigente_hasta IS NULL OR vigente_hasta >= ${currentExpression})
                ORDER BY vigente_desde DESC
                LIMIT 1
            `, effectiveDate ? [series.id, effectiveValue] : [series.id]);

            const current = currentResult.rows[0];
            if (current && Number(current.monto_total) === monto) {
                continue;
            }

            if (current) {
                await client.query(`
                    UPDATE reservas_fijas_precios
                    SET vigente_hasta = ${currentExpression} - INTERVAL '1 second'
                    WHERE id = $1
                `, effectiveDate ? [current.id, effectiveValue] : [current.id]);
            }

            await client.query(`
                INSERT INTO reservas_fijas_precios
                    (reserva_fija_id, monto_total, vigente_desde)
                VALUES ($1, $2, ${effectiveExpression})
                ON CONFLICT (reserva_fija_id, vigente_desde)
                DO UPDATE SET
                    monto_total = EXCLUDED.monto_total,
                    vigente_hasta = NULL
            `, effectiveDate
                ? [series.id, monto, effectiveValue]
                : [series.id, monto]);

            // Se conserva para compatibilidad con consultas antiguas.
            await client.query(
                'UPDATE reservas_fijas SET monto_total = $1 WHERE id = $2',
                [monto, series.id]
            );

            // Un turno cobrado representa una operación histórica y no se recalcula.
            await client.query(`
                UPDATE turnos t
                SET monto_total = $1
                WHERE t.reserva_fija_id = $2
                  AND (t.fecha + t.hora_inicio) >= ${effectiveExpression}
                  AND NOT EXISTS (
                      SELECT 1
                      FROM pagos p
                      WHERE p.turno_id = t.id
                  )
            `, effectiveDate
                ? [monto, series.id, effectiveValue]
                : [monto, series.id]);
        }
    },

    async getByClave(clave) {
        const result = await pool.query('SELECT * FROM configuracion WHERE clave = $1', [clave]);
        return result.rows[0];
    }
};

module.exports = ConfiguracionModel;
