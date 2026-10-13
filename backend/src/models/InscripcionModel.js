const pool = require('../config/db');
const { DomainError, INSCRIPTION_METHODS, money, method } = require('../utils/financial');

const InscripcionModel = {
    async create(data) {
        const { torneo_id, jugador_id } = data;
        const query = `
            INSERT INTO inscripciones (torneo_id, jugador_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await pool.query(query, [torneo_id, jugador_id]);
        return result.rows[0];
    },

    async getByTorneo(torneoId) {
        const query = `
            SELECT i.*, j.nombre as jugador_nombre, c.descripcion as jugador_categoria
            FROM inscripciones i
            JOIN jugadores j ON i.jugador_id = j.id
            LEFT JOIN categorias c ON j.categoria_id = c.id
            WHERE i.torneo_id = $1
            ORDER BY j.nombre ASC
        `;
        const result = await pool.query(query, [torneoId]);
        return result.rows;
    },

    async registrarPago(id, pagos, torneoEsperado, caja_id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            if (!caja_id) throw new DomainError('Caja requerida', 409);
            const cajaRes = await client.query("SELECT id FROM cajas WHERE id=$1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
            if (!cajaRes.rows.length) throw new DomainError('La caja no está abierta', 409);
            const insRes = await client.query(`SELECT i.*, t.costo_inscripcion, t.descripcion AS torneo_descripcion FROM inscripciones i JOIN torneos t ON t.id=i.torneo_id WHERE i.id=$1 FOR UPDATE`, [id]);
            if (!insRes.rows.length) throw new DomainError('Inscripción no encontrada', 404);
            const ins = insRes.rows[0];
            if (String(ins.torneo_id) !== String(torneoEsperado)) throw new DomainError('La inscripción no pertenece al torneo', 409);
            if (ins.estado === 'baja') throw new DomainError('La inscripción está dada de baja', 409);

            const payments = Array.isArray(pagos) ? pagos : [pagos];
            if (!payments.length || payments.some(p => !p)) throw new DomainError('Debe informar al menos un pago');
            let totalRecibido = 0;
            let ultimoMetodo = '';

            for (const p of payments) {
                const monto = money(p.monto);
                const metodo = p.metodo;
                method(metodo);
                if (!INSCRIPTION_METHODS.has(metodo)) throw new DomainError('Método de pago no permitido para inscripciones');
                if (metodo === 'cuenta_corriente' && (!ins.jugador_id || (p.jugador_id && String(p.jugador_id) !== String(ins.jugador_id)))) throw new DomainError('La cuenta corriente debe usar el jugador de la inscripción');
                if (metodo === 'cuenta_corriente' && !ins.jugador_id) throw new DomainError('Jugador obligatorio para cuenta corriente');
                totalRecibido += monto;
                ultimoMetodo = metodo;

                await client.query(`
                    INSERT INTO pagos_inscripcion (inscripcion_id, monto, metodo, caja_id)
                    VALUES ($1, $2, $3, $4)
                `, [id, monto, metodo, caja_id]);

                if (metodo === 'cuenta_corriente') {
                    await client.query(`INSERT INTO movimientos_cuenta (jugador_id,tipo,monto,descripcion,referencia_id,caja_id,metodo_pago,referencia_tipo) VALUES ($1,'DEBE',$2,$3,$4,$5,$6,'inscripcion')`, [ins.jugador_id, monto, `Inscripción Torneo #${ins.torneo_id}`, id, caja_id, metodo]);
                }
            }
            const pendiente = Number(ins.costo_inscripcion) - Number(ins.monto_abonado || 0);
            if (totalRecibido > pendiente + 0.005) throw new DomainError('El pago supera el saldo pendiente', 409);

            const queryUpdate = `
                UPDATE inscripciones i
                SET 
                    monto_abonado = COALESCE(i.monto_abonado, 0) + $2,
                    fecha_pago = CURRENT_TIMESTAMP,
                    metodo_pago = $3,
                    pagado = (COALESCE(i.monto_abonado, 0) + $2) >= (SELECT costo_inscripcion FROM torneos t WHERE t.id = i.torneo_id)
                WHERE i.id = $1
                RETURNING *
            `;
            const result = await client.query(queryUpdate, [id, totalRecibido, payments.length > 1 ? 'Múltiple' : ultimoMetodo]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async cambiarEstado(id, estado) {
        const query = 'UPDATE inscripciones SET estado = $2 WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id, estado]);
        return result.rows[0];
    }
};

module.exports = InscripcionModel;
