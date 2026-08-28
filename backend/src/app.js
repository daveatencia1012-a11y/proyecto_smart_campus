import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/DB.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend UAJS Smart Campus funcionando"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [result] = await db.query("SELECT 1 AS conectado");

        res.json({
            mensaje: "Conexión con MySQL exitosa",
            resultado: result
        });

    } catch (error) {
        console.error("Error de conexión:", error);

        res.status(500).json({
            mensaje: "Error conectando con MySQL"
        });
    }
});

const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});