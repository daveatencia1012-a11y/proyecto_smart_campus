import mysql from 'mysql2/promise';

if (!process.env.DB_USER || process.env.DB_USER.toLowerCase() === 'root' || !process.env.DB_PASSWORD) {
  throw new Error('Configura DB_USER no root y DB_PASSWORD para este servicio');
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 3306),
  stringifyObjects: true,
  database: process.env.DB_NAME || 'resources_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
