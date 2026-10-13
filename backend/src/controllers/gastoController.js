const GastoModel = require('../models/GastoModel');

const GastoController = {
    create: async (req, res) => {
        try {
            const { descripcion, monto } = req.body;
            const metodo_pago = req.body.metodo_pago || req.body.metodo || 'efectivo';
            if (!req.caja) return res.status(409).json({ error: 'No hay una caja abierta' });

            const gasto = await GastoModel.create({
                descripcion,
                monto,
                caja_id: req.caja.id,
                metodo_pago,
                usuario_id: req.user ? req.user.id : null // Assuming auth middleware populates req.user
            });

            res.status(201).json(gasto);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al registrar gasto' });
        }
    },

    getAll: async (req, res) => {
        try {
            const gastos = await GastoModel.getAll();
            res.json(gastos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener gastos' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await GastoModel.delete(id);
            if (!deleted) return res.status(404).json({ error: 'Gasto no encontrado' });
            res.json(deleted);
        } catch (error) {
            console.error(error);
            res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al eliminar gasto' });
        }
    }
};

module.exports = GastoController;
