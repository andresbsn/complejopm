const pool = require('../config/db');
const { DomainError, money, method } = require('../utils/financial');

const PagoModel = {
    async create(data) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const { turno_id, monto, metodo, observaciones, jugador_id, caja_id } = data;
            if (!caja_id) throw new DomainError('Caja requerida', 409);
            const amount = money(monto); method(metodo);
            const caja = await client.query("SELECT id FROM cajas WHERE id = $1 AND estado = 'abierta' FOR UPDATE", [caja_id]);
            if (!caja.rows.length) throw new DomainError('La caja no está abierta', 409);
            const turnoRes = await client.query('SELECT t.*, c.tipo AS cancha_tipo FROM turnos t JOIN canchas c ON c.id=t.cancha_id WHERE t.id=$1 FOR UPDATE', [turno_id]);
            if (!turnoRes.rows.length) throw new DomainError('Turno no encontrado', 404);
            const turno = turnoRes.rows[0];
            if (turno.estado === 'cancelado') throw new DomainError('No se puede cobrar un turno cancelado', 409);
            if (metodo === 'cuenta_corriente' && !jugador_id) throw new DomainError('Se requiere jugador_id para cuenta corriente');
            const total = await client.query('SELECT COALESCE(SUM(monto),0) AS total FROM pagos WHERE turno_id=$1', [turno_id]);
            if (amount > Number(turno.monto_total) - Number(total.rows[0].total) + 0.005) throw new DomainError('El monto supera el saldo pendiente', 409);
            if (metodo === 'cuenta_corriente') {
                await client.query(`INSERT INTO movimientos_cuenta (jugador_id,tipo,monto,descripcion,referencia_id,caja_id,metodo_pago,referencia_tipo) VALUES ($1,'DEBE',$2,$3,$4,$5,$6,'turno')`, [jugador_id, amount, `Pago Turno #${turno_id}${observaciones ? ` (${observaciones})` : ''}`, turno_id, caja_id, metodo]);
            }
            const result = await client.query(`INSERT INTO pagos (turno_id,monto,metodo,caja_id,observaciones) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [turno_id, amount, metodo, caja_id, observaciones]);
            if (Number(total.rows[0].total) + amount >= Number(turno.monto_total)) await client.query('UPDATE turnos SET pagado=TRUE WHERE id=$1', [turno_id]);
            await client.query('COMMIT'); return result.rows[0];
        } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    },
    async getByTurno(turnoId) {
        const result = await pool.query('SELECT * FROM pagos WHERE turno_id = $1 ORDER BY fecha_pago DESC', [turnoId]);
        return result.rows;
    }
};
module.exports = PagoModel;
