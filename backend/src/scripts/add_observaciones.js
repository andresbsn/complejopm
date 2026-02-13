const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres_35702',
    port: 5432,
});

const runMigration = async () => {
    try {
        console.log('Adding observaciones to ventas_cantina...');
        await pool.query('ALTER TABLE complejo_deportivo.ventas_cantina ADD COLUMN IF NOT EXISTS observaciones TEXT');

        console.log('Adding observaciones to pagos...');
        await pool.query('ALTER TABLE complejo_deportivo.pagos ADD COLUMN IF NOT EXISTS observaciones TEXT');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
