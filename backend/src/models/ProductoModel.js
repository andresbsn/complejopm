const pool = require('../config/db');

const ProductoModel = {
    // Obtener todos los productos
    async getAll() {
        const query = 'SELECT * FROM productos ORDER BY nombre ASC';
        const result = await pool.query(query);
        return result.rows;
    },

    // Obtener un producto por ID
    async getById(id) {
        const query = 'SELECT * FROM productos WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Crear un nuevo producto
    async create(data) {
        const { nombre, categoria, precio, stock } = data;
        const query = `
            INSERT INTO productos (nombre, categoria, precio, stock)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, categoria, precio, stock]);
        return result.rows[0];
    },

    // Actualizar un producto
    async update(id, data) {
        const { nombre, categoria, precio, stock } = data;
        const query = `
            UPDATE productos
            SET nombre = $1, categoria = $2, precio = $3, stock = $4
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, categoria, precio, stock, id]);
        return result.rows[0];
    },

    // Eliminar un producto
    async delete(id) {
        const query = 'DELETE FROM productos WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = ProductoModel;
