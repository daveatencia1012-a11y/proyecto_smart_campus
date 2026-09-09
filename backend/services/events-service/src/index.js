import 'dotenv/config';
import pool from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 3205;

pool.getConnection()
  .then(() => {
    console.log('Conexión a MySQL establecida');
  })
  .catch((err) => {
    console.error('Error conectando a MySQL:', err);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`Servicio de eventos corriendo en puerto ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
