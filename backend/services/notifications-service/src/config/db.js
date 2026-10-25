import mysql from "mysql2/promise";

if (!process.env.DB_USER || process.env.DB_USER.toLowerCase() === 'root' || !process.env.DB_PASSWORD) {
  throw new Error('Configura DB_USER no root y DB_PASSWORD para este servicio');
}

const db = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  stringifyObjects: true,
  database: process.env.DB_NAME || "notifications_db",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  charset: "utf8mb4"
});

export default db;
