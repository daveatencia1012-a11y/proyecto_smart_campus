USE reservations_db;

CREATE TABLE IF NOT EXISTS calendario_locks (
  recurso_id INT NOT NULL,
  fecha DATE NOT NULL,
  PRIMARY KEY (recurso_id, fecha)
) ENGINE=InnoDB;

-- Reejecutable en MySQL 8 sin borrar datos ni reconstruir el volumen.
SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'reservas' AND index_name = 'idx_reservas_calendario') = 0,
  'CREATE INDEX idx_reservas_calendario ON reservas (recurso_id, fecha, estado, hora_inicio, hora_fin)',
  'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

SET @ddl = IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE() AND table_name = 'disponibilidad' AND index_name = 'idx_disponibilidad_calendario') = 0,
  'CREATE INDEX idx_disponibilidad_calendario ON disponibilidad (recurso_id, fecha, hora_inicio, hora_fin)',
  'SELECT 1'
);
PREPARE migration FROM @ddl;
EXECUTE migration;
DEALLOCATE PREPARE migration;

-- Reportar conflictos legados: requieren revisión manual, nunca borrado automático.
SELECT a.id AS reserva_a, b.id AS reserva_b
FROM reservas a JOIN reservas b
  ON a.id < b.id AND a.recurso_id = b.recurso_id AND a.fecha = b.fecha
  AND a.hora_inicio < b.hora_fin AND a.hora_fin > b.hora_inicio
WHERE a.estado <> 'cancelada' AND b.estado <> 'cancelada';

SELECT r.id AS reserva_id, d.id AS disponibilidad_id
FROM reservas r JOIN disponibilidad d
  ON r.recurso_id = d.recurso_id AND r.fecha = d.fecha
  AND r.hora_inicio < d.hora_fin AND r.hora_fin > d.hora_inicio
WHERE r.estado <> 'cancelada';
