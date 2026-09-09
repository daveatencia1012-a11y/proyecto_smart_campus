import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 3204;

const server = app.listen(PORT, () => {
  console.log(`Resources service running on port ${PORT}`);
});

pool.getConnection()
  .then(() => console.log('Connected to resources_db'))
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    pool.end().then(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
