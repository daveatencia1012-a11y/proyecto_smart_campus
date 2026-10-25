-- Conexión en UTF-8 completo: sin esto el cliente de MySQL guarda las tildes dañadas (DEF-01).
SET NAMES utf8mb4;

-- Migración aditiva y reejecutable (SD2-02). Solo para volúmenes existentes:
-- en un volumen nuevo init.sql ya crea estas columnas y restricciones.
--   * actualizado_en: fecha de la última modificación de cada registro.
--     solicitudes ya la tenía con el nombre fecha_actualizacion.
--   * CHECK hora_fin > hora_inicio en reservas y disponibilidad (guía §6.1).
--     Si un registro antiguo no cumple la regla, el ALTER falla y hay que corregirlo antes.

-- users_db.users
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'users_db' AND table_name = 'users' AND column_name = 'actualizado_en') = 0,
  'ALTER TABLE users_db.users ADD actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- requests_db.pqrs
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'requests_db' AND table_name = 'pqrs' AND column_name = 'actualizado_en') = 0,
  'ALTER TABLE requests_db.pqrs ADD actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- reservations_db.reservas
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'reservations_db' AND table_name = 'reservas' AND column_name = 'actualizado_en') = 0,
  'ALTER TABLE reservations_db.reservas ADD actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'reservations_db' AND table_name = 'reservas' AND constraint_name = 'chk_reservas_horario') = 0,
  'ALTER TABLE reservations_db.reservas ADD CONSTRAINT chk_reservas_horario CHECK (hora_fin > hora_inicio)', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- reservations_db.disponibilidad
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'reservations_db' AND table_name = 'disponibilidad' AND constraint_name = 'chk_disponibilidad_horario') = 0,
  'ALTER TABLE reservations_db.disponibilidad ADD CONSTRAINT chk_disponibilidad_horario CHECK (hora_fin > hora_inicio)', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- resources_db.recursos
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'resources_db' AND table_name = 'recursos' AND column_name = 'actualizado_en') = 0,
  'ALTER TABLE resources_db.recursos ADD actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;

-- events_db.eventos
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'events_db' AND table_name = 'eventos' AND column_name = 'actualizado_en') = 0,
  'ALTER TABLE events_db.eventos ADD actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE migration FROM @ddl; EXECUTE migration; DEALLOCATE PREPARE migration;
