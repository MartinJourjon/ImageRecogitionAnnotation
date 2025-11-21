const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'image_annotation',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Ensure autocommit is enabled (default in PostgreSQL)
  // Individual queries via pool.query() will auto-commit
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', (client) => {
  console.log('[DB POOL] New client connected to database');
});

// Test connection and log configuration
pool.query('SELECT NOW() as current_time, current_setting(\'transaction_isolation\') as isolation_level')
  .then(result => {
    console.log('[DB POOL] Database connected successfully');
    console.log('[DB POOL] Current time:', result.rows[0].current_time);
    console.log('[DB POOL] Isolation level:', result.rows[0].isolation_level);
  })
  .catch(err => {
    console.error('[DB POOL] Failed to connect to database:', err);
  });

module.exports = pool;
