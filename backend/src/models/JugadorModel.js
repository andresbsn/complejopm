const pool = require('../config/db');

const JugadorModel = {
    async create(data) {
        const { nombre, telefono, email } = data;
        const query = `
            INSERT INTO jugadores (nombre, telefono, email)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, telefono, email]);
        return result.rows[0];
    },

    async getAll() {
        const query = 'SELECT * FROM jugadores ORDER BY nombre ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    async search(termino) {
        const query = `
            SELECT * FROM jugadores 
            WHERE nombre ILIKE $1 
            ORDER BY nombre ASC 
            LIMIT 10
        `;
        const result = await pool.query(query, [`%${termino}%`]);
        return result.rows;
    }
};

module.exports = JugadorModel;
