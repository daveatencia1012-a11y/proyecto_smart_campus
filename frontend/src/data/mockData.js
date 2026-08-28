export const services = [
  {
    id: 1,
    name: "Solicitudes",
    description: "Registra y consulta tus solicitudes universitarias.",
    icon: "📋",
  },
  {
    id: 2,
    name: "Reservas",
    description: "Reserva salas, laboratorios y recursos universitarios.",
    icon: "📅",
  },
  {
    id: 3,
    name: "Recursos",
    description: "Consulta los recursos disponibles en la universidad.",
    icon: "💻",
  },
  {
    id: 4,
    name: "Eventos",
    description: "Consulta eventos y actividades institucionales.",
    icon: "🎓",
  },
  {
    id: 5,
    name: "Notificaciones",
    description: "Consulta tus comunicaciones y alertas.",
    icon: "🔔",
  },
  {
    id: 6,
    name: "PQRS",
    description: "Registra peticiones, quejas, reclamos y sugerencias.",
    icon: "💬",
  },
];

export const requests = [
  {
    id: 1001,
    type: "Reserva de laboratorio",
    date: "15/08/2026",
    status: "EN PROCESO",
    description: "Solicitud de laboratorio para actividad académica.",
  },
  {
    id: 1002,
    type: "Solicitud de recurso",
    date: "14/08/2026",
    status: "EN REVISIÓN",
    description: "Solicitud de equipo audiovisual.",
  },
  {
    id: 1003,
    type: "PQRS",
    date: "12/08/2026",
    status: "RESUELTA",
    description: "Consulta relacionada con un servicio universitario.",
  },
];

export const stats = {
  requests: 3,
  reservations: 2,
  notifications: 5,
  events: 4,
};

export const reservations = [
  {
    id: 2001,
    resource: "Sala 201",
    type: "Sala",
    date: "20/08/2026",
    startTime: "09:00",
    endTime: "11:00",
    location: "Bloque A · Segundo piso",
    status: "CONFIRMADA",
    description: "Espacio reservado para una actividad académica.",
  },
  {
    id: 2002,
    resource: "Laboratorio de Computación 2",
    type: "Laboratorio",
    date: "22/08/2026",
    startTime: "14:00",
    endTime: "16:00",
    location: "Bloque B · Primer piso",
    status: "PENDIENTE",
    description: "Práctica de desarrollo de software.",
  },
  {
    id: 2003,
    resource: "Proyector Epson",
    type: "Equipo",
    date: "12/08/2026",
    startTime: "10:00",
    endTime: "12:00",
    location: "Audiovisuales · Bloque C",
    status: "FINALIZADA",
    description: "Préstamo de equipo audiovisual para exposición.",
  },
  {
    id: 2004,
    resource: "Auditorio Principal",
    type: "Auditorio",
    date: "28/08/2026",
    startTime: "15:00",
    endTime: "17:00",
    location: "Edificio Administrativo",
    status: "CONFIRMADA",
    description: "Espacio para actividad institucional.",
  },
];


export const events = [
  { id: 3001, title: "Seminario de Innovación", type: "Seminario", day: "15", month: "MAY", time: "09:00 AM - 11:00 AM", location: "Auditorio Principal", description: "Espacio para compartir tendencias, proyectos y experiencias de innovación.", inscribed: true, status: "PRÓXIMO" },
  { id: 3002, title: "Taller de Programación", type: "Taller", day: "20", month: "MAY", time: "02:00 PM - 05:00 PM", location: "Lab. de Computación 2", description: "Taller práctico de desarrollo de software para estudiantes.", inscribed: true, status: "PRÓXIMO" },
  { id: 3003, title: "Feria de Emprendimiento", type: "Feria", day: "25", month: "MAY", time: "10:00 AM - 04:00 PM", location: "Plaza Central", description: "Encuentro de iniciativas, emprendimientos y proyectos universitarios.", inscribed: false, status: "PRÓXIMO" },
  { id: 3004, title: "Encuentro de Investigación", type: "Encuentro", day: "30", month: "MAY", time: "08:00 AM - 12:00 PM", location: "Bloque Administrativo", description: "Presentación de proyectos y resultados de investigación.", inscribed: false, status: "PRÓXIMO" },
];

export const resources = [
  { id: 4001, code: "REC-001", name: "Proyector Epson", type: "Equipo audiovisual", location: "Audiovisuales · Bloque C", status: "DISPONIBLE", icon: "▣", description: "Proyector para actividades académicas y exposiciones." },
  { id: 4002, code: "SAL-201", name: "Sala 201", type: "Sala académica", location: "Bloque A · Segundo piso", status: "DISPONIBLE", icon: "⌂", description: "Sala equipada para reuniones y actividades académicas." },
  { id: 4003, code: "LAB-002", name: "Laboratorio de Computación 2", type: "Laboratorio", location: "Bloque B · Primer piso", status: "EN USO", icon: "▤", description: "Laboratorio con estaciones de trabajo para prácticas." },
  { id: 4004, code: "AUD-001", name: "Auditorio Principal", type: "Auditorio", location: "Edificio Administrativo", status: "DISPONIBLE", icon: "◈", description: "Espacio para conferencias, seminarios y actividades institucionales." },
  { id: 4005, code: "REC-014", name: "Kit de grabación", type: "Equipo tecnológico", location: "Centro Audiovisual", status: "MANTENIMIENTO", icon: "◉", description: "Kit para registro audiovisual de actividades." },
  { id: 4006, code: "SAL-305", name: "Sala 305", type: "Sala académica", location: "Bloque A · Tercer piso", status: "DISPONIBLE", icon: "⌂", description: "Espacio para tutorías, reuniones y trabajo colaborativo." },
];

export const notifications = [
  { id: 5001, title: "Tu solicitud #1234 fue actualizada", message: "La solicitud pasó al estado En proceso.", time: "Hace 5 minutos", type: "primary", icon: "↗", read: false },
  { id: 5002, title: "Reserva confirmada - Sala 201", message: "Tu reserva para el 20 de agosto fue confirmada.", time: "Hace 1 hora", type: "success", icon: "✓", read: false },
  { id: 5003, title: "Nuevo evento disponible", message: "Se publicó una nueva actividad institucional.", time: "Hace 3 horas", type: "warning", icon: "◈", read: false },
  { id: 5004, title: "Recordatorio: Taller de React", message: "El taller comienza mañana a las 2:00 PM.", time: "Hace 5 horas", type: "info", icon: "◷", read: true },
  { id: 5005, title: "Solicitud resuelta", message: "Tu solicitud de certificado fue cerrada.", time: "Ayer", type: "success", icon: "✓", read: true },
];
