import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "campus_secret_change_me";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id ?? payload.sub,
      rol: payload.rol || payload.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (roles.length && !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: "Acceso denegado: rol no autorizado" });
    }
    next();
  };
}

export default { authenticate, authorize };
