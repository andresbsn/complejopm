const CuentaModel = require('../models/CuentaModel');
const { DomainError, MONETARY_METHODS, money } = require('../utils/financial');

const cuentaController = {
    getMovimientos: async (req, res) => {
        try {
            const { jugadorId } = req.params;
            const movimientos = await CuentaModel.getByJugador(jugadorId);
            const saldo = await CuentaModel.getSaldo(jugadorId);
            res.json({ movimientos, saldo });
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            res.status(500).json({ error: 'Error al obtener la cuenta corriente' });
        }
    },

    addMovimiento: async (req, res) => {
        try {
            const { jugador_id, tipo, monto, descripcion, referencia_id, metodo_pago } = req.body;

            if (!jugador_id || !tipo || monto === undefined) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }
            if (!['DEBE', 'HABER'].includes(tipo)) throw new DomainError('Tipo debe ser DEBE o HABER');
            const amount = money(monto);
            if (tipo === 'HABER' && (!req.caja || !MONETARY_METHODS.has(metodo_pago))) throw new DomainError('HABER requiere caja y método monetario', 409);

            let caja_id = req.caja ? req.caja.id : null;

            const nuevoMovimiento = await CuentaModel.addMovimiento({
                jugador_id,
                tipo,
                monto: amount,
                descripcion,
                referencia_id,
                caja_id,
                metodo_pago
            });

            const nuevoSaldo = await CuentaModel.getSaldo(jugador_id);

            res.status(201).json({ movimiento: nuevoMovimiento, nuevoSaldo });
        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al registrar movimiento' });
        }
    }
};

module.exports = cuentaController;
