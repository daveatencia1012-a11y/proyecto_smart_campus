import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 3206;

app.listen(PORT, () => {
  console.log(`notifications-service escuchando en el puerto ${PORT}`);
});
