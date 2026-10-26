-- Datos semilla ficticios para demostrar los flujos del Entregable 2.
-- Se cargan solos al crear un volumen nuevo de MySQL (después de init.sql y 002).
-- Todos los nombres y correos son inventados.
-- Contraseña de los usuarios de demostración: 12345678
-- Las fechas son relativas al día en que se crea la base, para que las
-- reservas y los eventos aparezcan siempre como próximos.
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Usuarios (users_db). El administrador (id 1) lo crea init.sql.
-- ------------------------------------------------------------
USE users_db;

INSERT INTO users (id, nombre, email, password_hash, rol, activo) VALUES
(2, 'Carlos Mendoza', 'docente.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'docente', 1),
(3, 'Diana Ruiz', 'docente2.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'docente', 1),
(4, 'Marta Herrera', 'administrativo.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'administrativo', 1),
(5, 'Andrés Pérez', 'administrativo2.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'administrativo', 1),
(6, 'Sofía Castro', 'estudiante.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'estudiante', 1),
(7, 'Juan Morales', 'estudiante2.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'estudiante', 1),
(8, 'Valentina Ríos', 'estudiante3.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'estudiante', 1),
(9, 'Luis Ortega', 'inactivo.demo@uniajs.edu.co', '$2b$10$rVhuhqFAG4lsu.46z3nPfu.vfbrF7/o43WMYKbgA3/sbJ0.f2AKGG', 'estudiante', 0);

-- ------------------------------------------------------------
-- Recursos (resources_db)
-- ------------------------------------------------------------
USE resources_db;

INSERT INTO recursos (id, codigo, nombre, tipo, ubicacion, estado, disponible, descripcion) VALUES
(1, 'AUL-101', 'Aula 101', 'aula', 'Bloque A, piso 1', 'disponible', 1, 'Aula para 35 personas con tablero y video beam.'),
(2, 'LAB-SIS-01', 'Laboratorio de Sistemas 1', 'laboratorio', 'Bloque B, piso 2', 'disponible', 1, '30 equipos de cómputo con software de desarrollo.'),
(3, 'LAB-SIS-02', 'Laboratorio de Sistemas 2', 'laboratorio', 'Bloque B, piso 2', 'en_mantenimiento', 0, 'En actualización de equipos.'),
(4, 'SAL-REU-01', 'Sala de reuniones 1', 'sala', 'Bloque C, piso 1', 'disponible', 1, 'Mesa para 10 personas y pantalla.'),
(5, 'AUD-01', 'Auditorio principal', 'auditorio', 'Bloque central', 'disponible', 1, 'Capacidad para 200 personas con sonido.'),
(6, 'VB-03', 'Video beam portátil 03', 'equipo', 'Almacén de audiovisuales', 'disponible', 1, 'Incluye cable HDMI y control remoto.'),
(7, 'PORT-12', 'Portátil 12', 'equipo', 'Biblioteca', 'fuera_servicio', 0, 'Pantalla dañada, pendiente de reparación.'),
(8, 'CAN-01', 'Cancha múltiple', 'espacio deportivo', 'Zona deportiva', 'disponible', 1, 'Cancha de microfútbol y baloncesto.');

-- ------------------------------------------------------------
-- Reservas y bloqueos de calendario (reservations_db)
-- ------------------------------------------------------------
USE reservations_db;

INSERT INTO reservas (id, usuario_id, recurso_id, fecha, hora_inicio, hora_fin, estado, motivo_cancelacion) VALUES
(1, 6, 2, CURDATE() + INTERVAL 1 DAY, '10:00:00', '12:00:00', 'confirmada', NULL),
(2, 7, 4, CURDATE() + INTERVAL 2 DAY, '14:00:00', '15:00:00', 'confirmada', NULL),
(3, 2, 5, CURDATE() + INTERVAL 5 DAY, '08:00:00', '10:00:00', 'confirmada', NULL),
(4, 8, 1, CURDATE() + INTERVAL 1 DAY, '16:00:00', '18:00:00', 'cancelada', 'Se cambió el horario del grupo de estudio.'),
(5, 6, 6, CURDATE() - INTERVAL 3 DAY, '09:00:00', '11:00:00', 'confirmada', NULL),
(6, 3, 8, CURDATE() + INTERVAL 4 DAY, '15:00:00', '17:00:00', 'confirmada', NULL);

INSERT INTO disponibilidad (recurso_id, fecha, hora_inicio, hora_fin, tipo) VALUES
(4, CURDATE() + INTERVAL 3 DAY, '08:00:00', '10:00:00', 'mantenimiento');

-- ------------------------------------------------------------
-- Solicitudes y PQRS (requests_db)
-- El historial guarda cada cambio de estado, igual que la API.
-- ------------------------------------------------------------
USE requests_db;

INSERT INTO solicitudes (id, usuario_id, tipo_servicio, dependencia, descripcion, prioridad, estado, responsable_id, fecha_creacion, historial) VALUES
(1, 6, 'Solicitud de recurso', 'Soporte TI', 'Necesito un video beam para la exposición del viernes.', 'alta', 'REGISTRADA', NULL,
  NOW() - INTERVAL 1 DAY,
  JSON_ARRAY(JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 6, 'fecha', DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y-%m-%dT%H:%i:%sZ')))),
(2, 7, 'Certificado', 'Registro Académico', 'Solicito certificado de notas del semestre anterior.', 'media', 'EN_REVISION', 4,
  NOW() - INTERVAL 3 DAY,
  JSON_ARRAY(
    JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 7, 'fecha', DATE_FORMAT(NOW() - INTERVAL 3 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_REVISION', 'anterior', 'REGISTRADA', 'actor_id', 4, 'fecha', DATE_FORMAT(NOW() - INTERVAL 2 DAY, '%Y-%m-%dT%H:%i:%sZ')))),
(3, 8, 'Reserva de laboratorio', 'Laboratorios', 'Requiero el laboratorio para una práctica de redes fuera del horario.', 'alta', 'ASIGNADA', 5,
  NOW() - INTERVAL 5 DAY,
  JSON_ARRAY(
    JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 8, 'fecha', DATE_FORMAT(NOW() - INTERVAL 5 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_REVISION', 'anterior', 'REGISTRADA', 'actor_id', 5, 'fecha', DATE_FORMAT(NOW() - INTERVAL 4 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'ASIGNADA', 'anterior', 'EN_REVISION', 'actor_id', 5, 'fecha', DATE_FORMAT(NOW() - INTERVAL 3 DAY, '%Y-%m-%dT%H:%i:%sZ')))),
(4, 2, 'Soporte académico', 'Soporte TI', 'La plataforma virtual no carga las notas del curso de Bases de Datos.', 'critica', 'EN_PROCESO', 5,
  NOW() - INTERVAL 6 DAY,
  JSON_ARRAY(
    JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 2, 'fecha', DATE_FORMAT(NOW() - INTERVAL 6 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_REVISION', 'anterior', 'REGISTRADA', 'actor_id', 5, 'fecha', DATE_FORMAT(NOW() - INTERVAL 5 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'ASIGNADA', 'anterior', 'EN_REVISION', 'actor_id', 5, 'fecha', DATE_FORMAT(NOW() - INTERVAL 5 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_PROCESO', 'anterior', 'ASIGNADA', 'actor_id', 5, 'fecha', DATE_FORMAT(NOW() - INTERVAL 4 DAY, '%Y-%m-%dT%H:%i:%sZ')))),
(5, 6, 'Certificado', 'Registro Académico', 'Solicito constancia de estudio para trámite bancario.', 'baja', 'RESUELTA', 4,
  NOW() - INTERVAL 10 DAY,
  JSON_ARRAY(
    JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 6, 'fecha', DATE_FORMAT(NOW() - INTERVAL 10 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_REVISION', 'anterior', 'REGISTRADA', 'actor_id', 4, 'fecha', DATE_FORMAT(NOW() - INTERVAL 9 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'ASIGNADA', 'anterior', 'EN_REVISION', 'actor_id', 4, 'fecha', DATE_FORMAT(NOW() - INTERVAL 9 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_PROCESO', 'anterior', 'ASIGNADA', 'actor_id', 4, 'fecha', DATE_FORMAT(NOW() - INTERVAL 8 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'RESUELTA', 'anterior', 'EN_PROCESO', 'actor_id', 4, 'fecha', DATE_FORMAT(NOW() - INTERVAL 7 DAY, '%Y-%m-%dT%H:%i:%sZ')))),
(6, 7, 'Otro', 'Bienestar Universitario', 'Información sobre el programa de apoyo psicológico.', 'media', 'CERRADA', 1,
  NOW() - INTERVAL 15 DAY,
  JSON_ARRAY(
    JSON_OBJECT('estado', 'REGISTRADA', 'actor_id', 7, 'fecha', DATE_FORMAT(NOW() - INTERVAL 15 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_REVISION', 'anterior', 'REGISTRADA', 'actor_id', 1, 'fecha', DATE_FORMAT(NOW() - INTERVAL 14 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'ASIGNADA', 'anterior', 'EN_REVISION', 'actor_id', 1, 'fecha', DATE_FORMAT(NOW() - INTERVAL 14 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'EN_PROCESO', 'anterior', 'ASIGNADA', 'actor_id', 1, 'fecha', DATE_FORMAT(NOW() - INTERVAL 13 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'RESUELTA', 'anterior', 'EN_PROCESO', 'actor_id', 1, 'fecha', DATE_FORMAT(NOW() - INTERVAL 12 DAY, '%Y-%m-%dT%H:%i:%sZ')),
    JSON_OBJECT('estado', 'CERRADA', 'anterior', 'RESUELTA', 'actor_id', 1, 'fecha', DATE_FORMAT(NOW() - INTERVAL 11 DAY, '%Y-%m-%dT%H:%i:%sZ'))));

INSERT INTO pqrs (id, usuario_id, tipo, asunto, descripcion, estado, respuesta) VALUES
(1, 6, 'queja', 'Ruido en la biblioteca', 'En la sala 2 hay mucho ruido en horas de estudio.', 'registrada', NULL),
(2, 7, 'peticion', 'Ampliar horario del laboratorio', 'Solicitamos abrir el laboratorio de sistemas los sábados.', 'en_revision', NULL),
(3, 8, 'sugerencia', 'Más puntos de carga', 'Sería útil instalar tomas eléctricas en la cafetería.', 'respondida', 'Se instalarán 10 puntos de carga el próximo mes.'),
(4, 2, 'reclamo', 'Video beam sin cable', 'El video beam del aula 101 no tenía cable HDMI.', 'cerrada', 'Se repuso el cable y se revisaron los demás equipos.');

-- ------------------------------------------------------------
-- Eventos (events_db). El evento 5 es privado: solo lo ven su autor y el administrador.
-- ------------------------------------------------------------
USE events_db;

INSERT INTO eventos (id, nombre, descripcion, fecha, hora, lugar, tipo, creado_por, publico) VALUES
(1, 'Semana de la Ingeniería', 'Charlas y talleres sobre desarrollo de software y redes.', CURDATE() + INTERVAL 7 DAY, '08:00:00', 'Auditorio principal', 'academico', 1, 1),
(2, 'Jornada de bienestar', 'Actividades de salud física y mental para la comunidad.', CURDATE() + INTERVAL 3 DAY, '14:00:00', 'Zona deportiva', 'institucional', 1, 1),
(3, 'Muestra cultural', 'Presentaciones de danza y música de los grupos artísticos.', CURDATE() + INTERVAL 10 DAY, '16:00:00', 'Plazoleta central', 'cultural', 1, 1),
(4, 'Torneo de microfútbol', 'Torneo interno entre programas académicos.', CURDATE() + INTERVAL 14 DAY, '15:00:00', 'Cancha múltiple', 'deportivo', 3, 1),
(5, 'Asesoría de proyecto integrador', 'Revisión de avances del proyecto de Sistemas Distribuidos.', CURDATE() + INTERVAL 2 DAY, '10:00:00', 'Sala de reuniones 1', 'academico', 2, 0);

-- ------------------------------------------------------------
-- Notificaciones (notifications_db), asociadas a los registros anteriores
-- ------------------------------------------------------------
USE notifications_db;

INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, referencia_id, referencia_tipo, leida, fecha_creacion) VALUES
(6, 'Reserva creada', 'Tu reserva del Laboratorio de Sistemas 1 quedó confirmada.', 'reserva', 1, 'reserva', 0, NOW() - INTERVAL 2 HOUR),
(6, 'Actualización de solicitud', 'Tu solicitud SOL-0005 cambió de estado a RESUELTA', 'solicitud', 5, 'solicitud', 1, NOW() - INTERVAL 7 DAY),
(7, 'Actualización de solicitud', 'Tu solicitud SOL-0002 cambió de estado a EN_REVISION', 'solicitud', 2, 'solicitud', 0, NOW() - INTERVAL 2 DAY),
(7, 'Reserva creada', 'Tu reserva de la Sala de reuniones 1 quedó confirmada.', 'reserva', 2, 'reserva', 1, NOW() - INTERVAL 1 DAY),
(8, 'Actualización de solicitud', 'Tu solicitud SOL-0003 cambió de estado a ASIGNADA', 'solicitud', 3, 'solicitud', 0, NOW() - INTERVAL 3 DAY),
(8, 'Respuesta a tu PQRS', 'Tu PQRS "Más puntos de carga" fue respondida.', 'pqrs', 3, 'pqrs', 0, NOW() - INTERVAL 1 DAY),
(8, 'Reserva cancelada', 'Tu reserva del Aula 101 fue cancelada.', 'reserva', 4, 'reserva', 1, NOW() - INTERVAL 12 HOUR),
(2, 'Actualización de solicitud', 'Tu solicitud SOL-0004 cambió de estado a EN_PROCESO', 'solicitud', 4, 'solicitud', 0, NOW() - INTERVAL 4 DAY),
(6, 'Nuevo evento', 'Se publicó el evento "Semana de la Ingeniería".', 'evento', 1, 'evento', 0, NOW() - INTERVAL 5 HOUR),
(1, 'Bienvenido a Smart Campus', 'La plataforma quedó lista con datos de demostración.', 'sistema', NULL, NULL, 0, NOW());
