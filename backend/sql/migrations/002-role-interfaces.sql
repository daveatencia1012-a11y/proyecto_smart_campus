-- Conexión en UTF-8 completo: sin esto el cliente de MySQL guarda las tildes dañadas (DEF-01).
SET NAMES utf8mb4;

-- Migración aditiva y reejecutable. No confirma reservas antiguas ni borra datos.
USE users_db;
CREATE TABLE IF NOT EXISTS configuracion (
  id TINYINT PRIMARY KEY,
  nombre_campus VARCHAR(120) NOT NULL,
  correo_contacto VARCHAR(254) NOT NULL DEFAULT '',
  mensaje_institucional VARCHAR(1000) NOT NULL DEFAULT ''
);
INSERT INTO configuracion (id, nombre_campus) SELECT 1, 'UAJS Smart Campus'
WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE id = 1);

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'permisos' AND column_name = 'alcance') = 0,
  "ALTER TABLE permisos ADD alcance VARCHAR(30) NOT NULL DEFAULT 'propio'", 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- Catálogo INFORMATIVO: la autorización sigue en rutas/controladores, no en esta tabla.
INSERT INTO permisos (rol, recurso, accion, alcance)
SELECT r.rol, p.recurso, p.accion,
  CASE p.alcance
    WHEN 'segun_rol' THEN IF(r.rol IN ('administrador','administrativo'), 'todos', 'propio')
    WHEN 'usuario' THEN IF(r.rol = 'administrador', 'todos', 'propio')
    WHEN 'evento' THEN IF(r.rol = 'administrador', 'todos', 'visibles')
    WHEN 'autor' THEN IF(r.rol = 'administrador', 'todos', 'propio')
    ELSE p.alcance END
FROM (SELECT 'estudiante' AS rol UNION ALL SELECT 'docente' UNION ALL SELECT 'administrativo' UNION ALL SELECT 'administrador') r
JOIN (
  SELECT 'usuarios' recurso, 'leer' accion, 'usuario' alcance, 'estudiante,docente,administrativo,administrador' roles
  UNION ALL SELECT 'usuarios','actualizar','usuario','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'usuarios','crear','todos','administrador'
  UNION ALL SELECT 'usuarios','eliminar','todos','administrador'
  UNION ALL SELECT 'solicitudes','crear','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'solicitudes','leer','segun_rol','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'solicitudes','actualizar','todos','administrativo,administrador'
  UNION ALL SELECT 'solicitudes','eliminar','todos','administrador'
  UNION ALL SELECT 'pqrs','crear','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'pqrs','leer','segun_rol','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'pqrs','actualizar','todos','administrativo,administrador'
  UNION ALL SELECT 'pqrs','eliminar','todos','administrador'
  UNION ALL SELECT 'reservas','crear','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'reservas','leer','segun_rol','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'reservas','actualizar','segun_rol','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'recursos','leer','disponibles','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'recursos','crear','todos','administrativo,administrador'
  UNION ALL SELECT 'recursos','actualizar','todos','administrativo,administrador'
  UNION ALL SELECT 'recursos','eliminar','todos','administrativo,administrador'
  UNION ALL SELECT 'eventos','leer','evento','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'eventos','crear','propio','docente,administrador'
  UNION ALL SELECT 'eventos','actualizar','autor','docente,administrador'
  UNION ALL SELECT 'eventos','eliminar','todos','administrador'
  UNION ALL SELECT 'notificaciones','leer','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'notificaciones','actualizar','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'notificaciones','eliminar','propio','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'servicios','leer','disponibles','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'servicios','crear','todos','administrador'
  UNION ALL SELECT 'servicios','actualizar','todos','administrador'
  UNION ALL SELECT 'servicios','eliminar','todos','administrador'
  UNION ALL SELECT 'configuracion','leer','institucional','estudiante,docente,administrativo,administrador'
  UNION ALL SELECT 'configuracion','actualizar','institucional','administrador'
  UNION ALL SELECT 'reportes','leer','operativo','administrativo,administrador'
  UNION ALL SELECT 'roles','leer','todos','administrador'
  UNION ALL SELECT 'permisos','leer','todos','administrador'
  UNION ALL SELECT 'monitoring','leer','todos','administrador'
) p ON FIND_IN_SET(r.rol, p.roles) > 0
WHERE NOT EXISTS (SELECT 1 FROM permisos old WHERE old.rol = r.rol AND old.recurso = p.recurso AND old.accion = p.accion);

USE resources_db;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'recursos' AND column_name = 'eliminado_en') = 0,
  'ALTER TABLE recursos ADD eliminado_en DATETIME NULL', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

CREATE TABLE IF NOT EXISTS servicios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  icono VARCHAR(30) NOT NULL DEFAULT 'services',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO servicios (codigo, nombre, descripcion, icono)
SELECT s.codigo, s.nombre, s.descripcion, s.icono FROM (
  SELECT 'solicitudes' codigo, 'Solicitudes' nombre, 'Registra y consulta tus solicitudes universitarias.' descripcion, 'requests' icono
  UNION ALL SELECT 'reservas','Reservas','Reserva salas, laboratorios y recursos universitarios.','reservations'
  UNION ALL SELECT 'recursos','Recursos','Consulta los recursos disponibles del campus.','resources'
  UNION ALL SELECT 'eventos','Eventos','Consulta las actividades académicas e institucionales.','events'
  UNION ALL SELECT 'notificaciones','Notificaciones','Consulta tus comunicaciones y alertas.','notifications'
  UNION ALL SELECT 'pqrs','PQRS','Registra peticiones, quejas, reclamos y sugerencias.','pqrs'
) s WHERE NOT EXISTS (SELECT 1 FROM servicios old WHERE old.codigo = s.codigo);

USE reservations_db;
ALTER TABLE reservas ALTER COLUMN estado SET DEFAULT 'confirmada';
