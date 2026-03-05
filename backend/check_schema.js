require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres_35702',
    port: process.env.DB_PORT || 5432,
    options: '-c search_path=complejo_deportivo'
};

const pool = new Pool(poolConfig);

(async () => {
    try {
        await pool.query("ALTER TABLE movimientos_cuenta ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50)");
        console.log("Column added successfully.");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
