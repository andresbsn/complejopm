const pool = require('../config/db');

const UserModel = {
    async findByUsername(username) {
        const result = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        return result.rows[0];
    },

    async create(user) {
        const { username, password, nombre, rol } = user;
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol',
            [username, password, nombre, rol || 'user']
        );
        return result.rows[0];
    }
};

module.exports = UserModel;
