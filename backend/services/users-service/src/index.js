import app from './app.js';

const PORT = process.env.PORT || 3201;

app.listen(PORT, () => {
  console.log(`users-service ejecutándose en http://localhost:${PORT}`);
});
