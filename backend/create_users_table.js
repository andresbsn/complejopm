require('dotenv').config({ path: './backend/.env' });
const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nombre VARCHAR(100) NOT NULL,
                rol VARCHAR(20) DEFAULT 'user'
            );
        `);
        console.log('Tabla usuarios creada');

        // Check if admin exists
        const res = await pool.query("SELECT * FROM usuarios WHERE username = 'admin'");
        if (res.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4)',
                ['admin', hashedPassword, 'Administrador', 'admin']
            );
            console.log('Usuario admin creado');
        } else {
            console.log('Usuario admin ya existe');
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

createTable();
