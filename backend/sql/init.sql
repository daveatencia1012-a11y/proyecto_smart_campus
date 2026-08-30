CREATE DATABASE IF NOT EXISTS users_db;
CREATE DATABASE IF NOT EXISTS requests_db;
CREATE DATABASE IF NOT EXISTS reservations_db;
CREATE DATABASE IF NOT EXISTS resources_db;
CREATE DATABASE IF NOT EXISTS events_db;
CREATE DATABASE IF NOT EXISTS notifications_db;

USE users_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('estudiante', 'docente', 'administrativo', 'administrador') NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rol ENUM('estudiante', 'docente', 'administrativo', 'administrador') NOT NULL,
  recurso VARCHAR(50) NOT NULL,
  accion ENUM('crear', 'leer', 'actualizar', 'eliminar') NOT NULL
);

USE requests_db;

CREATE TABLE IF NOT EXISTS solicitudes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo_servicio VARCHAR(100) NOT NULL,
  dependencia VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad ENUM('baja', 'media', 'alta', 'critica') NOT NULL,
  estado ENUM('REGISTRADA', 'EN_REVISION', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA') DEFAULT 'REGISTRADA',
  responsable_id INT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  historial JSON NULL
);

CREATE TABLE IF NOT EXISTS pqrs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo ENUM('peticion', 'queja', 'reclamo', 'sugerencia') NOT NULL,
  asunto VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  estado ENUM('registrada', 'en_revision', 'respondida', 'cerrada') DEFAULT 'registrada',
  respuesta TEXT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

USE reservations_db;

CREATE TABLE IF NOT EXISTS reservas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  recurso_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  estado ENUM('confirmada', 'cancelada', 'pendiente') DEFAULT 'pendiente',
  motivo_cancelacion TEXT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disponibilidad (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recurso_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  tipo ENUM('reserva', 'mantenimiento', 'bloqueo') NOT NULL
);

USE resources_db;

CREATE TABLE IF NOT EXISTS recursos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  ubicacion VARCHAR(100) NOT NULL,
  estado ENUM('disponible', 'en_mantenimiento', 'fuera_servicio') NOT NULL,
  disponible TINYINT(1) DEFAULT 1,
  descripcion TEXT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

USE events_db;

CREATE TABLE IF NOT EXISTS eventos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  lugar VARCHAR(100) NOT NULL,
  tipo ENUM('academico', 'institucional', 'cultural', 'deportivo', 'otro') NOT NULL,
  creado_por INT NOT NULL,
  publico TINYINT(1) DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

USE notifications_db;

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo ENUM('solicitud', 'reserva', 'evento', 'sistema', 'pqrs') NOT NULL,
  referencia_id INT NULL,
  referencia_tipo VARCHAR(50) NULL,
  leida TINYINT(1) DEFAULT 0,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
