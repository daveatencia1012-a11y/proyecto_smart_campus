export function calendarError(statusCode, message) {
  return Object.assign(new Error(message), { status: statusCode, statusCode });
}

export function positiveId(value) {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    throw calendarError(400, 'Identificador inválido');
  }
  return Number(value);
}

export function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw calendarError(400, 'fecha debe tener formato YYYY-MM-DD');
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < '1000-01-01') {
    throw calendarError(400, 'fecha inválida');
  }
  return value;
}

export function timeOnly(value) {
  if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    throw calendarError(400, 'La hora debe tener formato HH:mm o HH:mm:ss');
  }
  return value.length === 5 ? `${value}:00` : value;
}

export function interval(data, businessHours = false) {
  const fecha = dateOnly(data.fecha);
  const hora_inicio = timeOnly(data.hora_inicio);
  const hora_fin = timeOnly(data.hora_fin);
  if (hora_inicio >= hora_fin) throw calendarError(400, 'La hora de inicio debe ser menor que la hora de fin');
  if (businessHours) {
    const start = timeOnly(process.env.BUSINESS_HOURS_START || '08:00');
    const end = timeOnly(process.env.BUSINESS_HOURS_END || '22:00');
    if (hora_inicio < start || hora_fin > end) throw calendarError(400, `El horario debe estar entre ${start} y ${end}`);
  }
  return { fecha, hora_inicio, hora_fin };
}

// Todas las escrituras del calendario usan esta misma conexion y orden de
// bloqueos. Las lecturas de conflictos son actuales (FOR UPDATE), no snapshots.
export async function withCalendarLocks(pool, keys, operation) {
  const ordered = [...new Map(keys.map(key => {
    const normalized = { recurso_id: positiveId(key.recurso_id), fecha: dateOnly(key.fecha) };
    return [`${normalized.recurso_id}:${normalized.fecha}`, normalized];
  })).values()].sort((a, b) => a.recurso_id - b.recurso_id || a.fecha.localeCompare(b.fecha));
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of ordered) {
      await conn.execute(
        `INSERT INTO calendario_locks (recurso_id, fecha) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE recurso_id = VALUES(recurso_id)`,
        [key.recurso_id, key.fecha]
      );
      await conn.execute(
        'SELECT recurso_id FROM calendario_locks WHERE recurso_id = ? AND fecha = ? FOR UPDATE',
        [key.recurso_id, key.fecha]
      );
    }
    const result = await operation(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
      throw calendarError(409, 'El calendario cambió; vuelve a intentarlo');
    }
    throw error;
  } finally {
    conn.release();
  }
}

export async function assertFree(conn, recurso_id, data, excludeId = null) {
  const params = [recurso_id, data.fecha, data.hora_fin, data.hora_inicio];
  const exclude = excludeId === null ? '' : ' AND id <> ?';
  const [reservas] = await conn.execute(
    `SELECT id FROM reservas WHERE recurso_id = ? AND fecha = ?
     AND estado <> 'cancelada' AND hora_inicio < ? AND hora_fin > ?${exclude}
     LIMIT 1 FOR UPDATE`, excludeId === null ? params : [...params, excludeId]
  );
  const [blocks] = await conn.execute(
    `SELECT id FROM disponibilidad WHERE recurso_id = ? AND fecha = ?
     AND hora_inicio < ? AND hora_fin > ? LIMIT 1 FOR UPDATE`, params
  );
  if (reservas.length || blocks.length) throw calendarError(409, 'El recurso está ocupado en ese horario');
}
