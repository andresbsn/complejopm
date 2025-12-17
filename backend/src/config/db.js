const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
// Se recomienda usar variables de entorno en producción
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'complejo_deportivo',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
};

if (process.env.DB_SCHEMA) {
  poolConfig.options = `-c search_path=${process.env.DB_SCHEMA}`;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
  process.exit(-1);
});

module.exports = pool;
