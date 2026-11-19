const ConfiguracionModel = require('../models/ConfiguracionModel');

const configuracionController = {
    getAll: async (req, res) => {
        try {
            const configs = await ConfiguracionModel.getAll();
            // Convert array to object for easier frontend usage
            const configObj = configs.reduce((acc, curr) => {
                acc[curr.clave] = curr.valor;
                return acc;
            }, {});
            res.json(configObj);
        } catch (error) {
            console.error('Error al obtener configuración:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    update: async (req, res) => {
        try {
            const { clave } = req.params;
            const { valor, vigencia_desde } = req.body;
            const updatedConfig = await ConfiguracionModel.update(clave, valor, vigencia_desde);
            res.json(updatedConfig);
        } catch (error) {
            console.error('Error al actualizar configuración:', error);
            const status = error.message.includes('debe ser') || error.message.includes('vigencia')
                ? 400
                : 500;
            res.status(status).json({ error: status === 400 ? error.message : 'Error interno del servidor' });
        }
    }
};

module.exports = configuracionController;
