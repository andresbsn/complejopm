const pool = require('../config/db');

const ConfiguracionModel = {
    async getAll() {
        const result = await pool.query('SELECT * FROM configuracion');
        return result.rows;
    },

    async update(clave, valor) {
        const query = 'UPDATE configuracion SET valor = $1 WHERE clave = $2 RETURNING *';
        const result = await pool.query(query, [valor, clave]);
        return result.rows[0];
    },

    async getByClave(clave) {
        const result = await pool.query('SELECT * FROM configuracion WHERE clave = $1', [clave]);
        return result.rows[0];
    }
};

module.exports = ConfiguracionModel;
