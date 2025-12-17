const VentaModel = require('../models/VentaModel');

const ventaController = {
    createVenta: async (req, res) => {
        try {
            const venta = await VentaModel.create(req.body);
            res.status(201).json(venta);
        } catch (error) {
            console.error('Error al crear venta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    getVentas: async (req, res) => {
        try {
            const { fechaDesde, fechaHasta } = req.query;
            const ventas = await VentaModel.getAll(fechaDesde, fechaHasta);
            // Opcional: Podríamos querer incluir los detalles en la lista, pero por ahora simple
            res.json(ventas);
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    getDetallesVenta: async (req, res) => {
        try {
            const { id } = req.params;
            const detalles = await VentaModel.getDetalles(id);
            res.json(detalles);
        } catch (error) {
            console.error('Error al obtener detalles de venta:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = ventaController;
