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

    async getAll(req, res) {
        try {
            const { search } = req.query;
            let jugadores;
            if (search) {
                jugadores = await JugadorModel.search(search);
            } else {
                jugadores = await JugadorModel.getAll();
            }
            res.json(jugadores);
        } catch (error) {
            console.error('Error al obtener jugadores:', error);
            res.status(500).json({ error: 'Error al obtener jugadores' });
        }
    }
};

module.exports = JugadorController;
