import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/DB.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});