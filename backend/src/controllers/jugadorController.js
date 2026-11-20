const JugadorModel = require('../models/JugadorModel');

const JugadorController = {
    async create(req, res) {
        try {
            const jugador = await JugadorModel.create(req.body);
            res.status(201).json(jugador);
        } catch (error) {
            console.error('Error al crear jugador:', error);
            res.status(500).json({ error: 'Error al crear jugador' });
        }
    },

    async update(req, res) {
        try {
            if (req.body.activo !== undefined && req.user?.rol !== 'admin') {
                return res.status(403).json({ error: 'Solo administradores pueden cambiar el estado de un jugador' });
            }
            const { id } = req.params;
            const jugador = await JugadorModel.update(id, req.body);
            if (!jugador) {
                return res.status(404).json({ error: 'Jugador no encontrado' });
            }
            res.json(jugador);
        } catch (error) {
            console.error('Error al actualizar jugador:', error);
            res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al actualizar jugador' });
        }
    },

    async delete(req, res) {
        try {
            const jugador = await JugadorModel.delete(req.params.id);
            if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' });
            res.json({ message: 'Jugador eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar jugador:', error);
            res.status(error.status || 500).json({ error: error.status ? error.message : 'Error al eliminar jugador' });
        }
    },

    async getAll(req, res) {
        try {
            const { search, includeInactive, inactiveOnly } = req.query;
            const showInactive = includeInactive === 'true';
            const onlyInactive = inactiveOnly === 'true';
            let jugadores;
            if (search) {
                jugadores = await JugadorModel.search(search, showInactive, onlyInactive);
            } else {
                jugadores = await JugadorModel.getAll(showInactive, onlyInactive);
            }
            res.json(jugadores);
        } catch (error) {
            console.error('Error al obtener jugadores:', error);
            res.status(500).json({ error: 'Error al obtener jugadores' });
        }
    }
};

module.exports = JugadorController;
