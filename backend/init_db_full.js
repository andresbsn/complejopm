const { Pool } = require('pg');

const poolConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres_35702',
    port: 5432,
    options: '-c search_path=complejo_deportivo' // Ensure we target the correct schema
};

console.log('Connecting to DB with:', { ...poolConfig, password: '****' });

const pool = new Pool(poolConfig);

const initDB = async () => {
    try {
        // 1. Create schema if not exists (just in case)
        await pool.query(`CREATE SCHEMA IF NOT EXISTS complejo_deportivo;`);

        // 2. Create jugadores table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS complejo_deportivo.jugadores (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                telefono VARCHAR(50),
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabla jugadores verificada/creada.');

        // 3. Create movimientos_cuenta table if not exists
        // Note: Explicitly using the schema prefix or relying on search_path
        await pool.query(`
            CREATE TABLE IF NOT EXISTS complejo_deportivo.movimientos_cuenta (
                id SERIAL PRIMARY KEY,
                jugador_id INTEGER REFERENCES complejo_deportivo.jugadores(id) ON DELETE CASCADE,
                tipo VARCHAR(10) CHECK (tipo IN ('DEBE', 'HABER')) NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                descripcion TEXT,
                referencia_id INTEGER,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Tabla movimientos_cuenta verificada/creada.');

        // 4. Verify
        const res1 = await pool.query("SELECT to_regclass('complejo_deportivo.jugadores')");
        const res2 = await pool.query("SELECT to_regclass('complejo_deportivo.movimientos_cuenta')");
        console.log('Verification:', {
            jugadores: res1.rows[0].to_regclass,
            movimientos: res2.rows[0].to_regclass
        });

    } catch (error) {
        console.error('Error inicializando DB:', error);
    } finally {
        pool.end();
    }
};

initDB();
