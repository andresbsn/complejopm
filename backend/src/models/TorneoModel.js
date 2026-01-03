const pool = require('../config/db');

const TorneoModel = {
    async create(data) {
        const { descripcion, fecha_inicio, costo_inscripcion } = data;
        const query = `
            INSERT INTO torneos (descripcion, fecha_inicio, costo_inscripcion)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [descripcion, fecha_inicio, costo_inscripcion]);
        return result.rows[0];
    },

    async getAll() {
        const query = 'SELECT * FROM torneos ORDER BY fecha_inicio DESC';
        const result = await pool.query(query);
        return result.rows;
    },

    async getById(id) {
        const query = 'SELECT * FROM torneos WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = TorneoModel;
