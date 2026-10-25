import mysql from 'mysql2/promise';

if (!process.env.DB_USER || process.env.DB_USER.toLowerCase() === 'root' || !process.env.DB_PASSWORD) {
  throw new Error('Configura DB_USER no root y DB_PASSWORD para este servicio');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dateStrings: true,
  stringifyObjects: true,
  database: process.env.DB_NAME || 'reservations_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
