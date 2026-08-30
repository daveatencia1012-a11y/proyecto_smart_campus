import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  crearNotificacion,
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodas,
  eliminarNotificacion,
  countGlobalNoLeidas
} from "../controllers/notificacionController.js";

const router = Router();

router.post("/", crearNotificacion);
router.get("/", authenticate, listarNotificaciones);
router.get("/no-leidas", authenticate, contarNoLeidas);
router.get("/conteo/no-leidas", authenticate, authorize('administrador'), countGlobalNoLeidas);
router.put("/:id/leer", authenticate, marcarLeida);
router.put("/marcar-todas", authenticate, marcarTodas);
router.delete("/:id", authenticate, eliminarNotificacion);

export default router;
