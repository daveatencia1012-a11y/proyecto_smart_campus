import app from './app.js';

const PORT = process.env.PORT || 3202;

app.listen(PORT, () => {
  console.log(`Servicio de solicitudes corriendo en el puerto ${PORT}`);
});
