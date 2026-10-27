import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useResource from '../hooks/useResource';
import { getReservations } from '../services/reservationsService';
import { listRecords, dateKey } from '../services/campusService';
import Icon from "../components/Icon/Icon";

const weekdayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const keyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const monthLabel = (date) => capitalize(new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(date).replace(" de ", " "));
const longDay = (date) => capitalize(new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(date));
const shortDay = (date) => new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" }).format(date).replaceAll(".", "");

function toReservationDate(value) {
  const [day, month, year] = value.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function Calendar() {
  const today = new Date();
  const todayKey = keyOf(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const mondayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    // Solo las semanas necesarias (5 o 6), para no dejar una fila vacía del mes siguiente.
    const length = Math.ceil((mondayIndex + total) / 7) * 7;
    return Array.from({ length }, (_, index) => {
      const date = new Date(year, month, index - mondayIndex + 1);
      return { date, key: keyOf(date), outside: date.getMonth() !== month };
    });
  }, [cursor]);

  const load = useCallback(async () => {
    const range = { fecha_desde: days[0].key, fecha_hasta: days.at(-1).key };
    const [reservations, events] = await Promise.all([getReservations(range), listRecords('events', range)]);
    return { reservations, events };
  }, [days]);
  const { data, loading, error, reload } = useResource(load);

  const itemsByDate = useMemo(() => {
    const map = {};
    const add = (key, item) => { (map[key] ||= []).push(item); };
    (data?.reservations || []).filter((row) => row.status !== 'CANCELADA').forEach((row) => add(toReservationDate(row.date), {
      id: row.id, kind: "reservation", label: row.resource, start: row.startTime, time: `${row.startTime} – ${row.endTime}`,
      location: row.location, detail: row.type, to: `/reservations/${row.id}`,
    }));
    (data?.events || []).forEach((row) => add(dateKey(row.fecha), {
      id: row.id, kind: "event", label: row.nombre, start: String(row.hora).slice(0, 5), time: String(row.hora).slice(0, 5),
      location: row.lugar, detail: row.publico ? "Evento público" : "Evento privado", to: "/events",
    }));
    Object.values(map).forEach((items) => items.sort((a, b) => a.start.localeCompare(b.start)));
    return map;
  }, [data]);

  const monthKeys = days.filter((day) => !day.outside).map((day) => day.key);
  const monthItems = monthKeys.flatMap((key) => itemsByDate[key] || []);
  const monthReservations = monthItems.filter((item) => item.kind === "reservation").length;
  const monthEvents = monthItems.length - monthReservations;
  const upcoming = Object.keys(itemsByDate).filter((key) => key >= todayKey).sort()
    .flatMap((key) => itemsByDate[key].map((item) => ({ ...item, key }))).slice(0, 4);

  const selected = new Date(`${selectedDate}T12:00:00`);
  const selectedItems = itemsByDate[selectedDate] || [];

  const changeMonth = (offset) => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
  };
  const selectDay = (day) => {
    setSelectedDate(day.key);
    if (day.outside) setCursor(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  };

  return (
    <main className="role-page calendar-view">
      <header className="calendar-view__heading">
        <div>
          <span className="panel__eyebrow">AGENDA SMART CAMPUS</span>
          <h1>Calendario universitario</h1>
          <p>Tus reservas y las actividades institucionales en una sola vista. Selecciona un día para ver su agenda.</p>
        </div>
        <Link className="button button--primary calendar-view__cta" to="/reservations">
          <Icon name="plus" size={16} /> Nueva reserva
        </Link>
      </header>

      {error && (
        <p className="calendar-view__notice" role="alert">
          <Icon name="alert" size={17} /> No fue posible cargar la agenda: {error}
          <button type="button" className="button button--secondary" onClick={reload}>Reintentar</button>
        </p>
      )}

      <section className="calendar-view__layout">
        <article className="calendar-view__board">
          <div className="calendar-view__toolbar">
            <div className="calendar-view__month">
              <button className="records-action" type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior" title="Mes anterior"><Icon name="arrowLeft" size={16} /></button>
              <h2 aria-live="polite">{monthLabel(cursor)}</h2>
              <button className="records-action" type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente" title="Mes siguiente"><Icon name="arrowRight" size={16} /></button>
              <button className="calendar-view__today" type="button" onClick={goToday}>Hoy</button>
              {loading && <span className="calendar-view__loading"><Icon name="refresh" size={14} /> Actualizando…</span>}
            </div>
            <div className="calendar-view__summary">
              <span className="calendar-view__chip calendar-view__chip--reservation"><i aria-hidden="true" />{monthReservations} {monthReservations === 1 ? "reserva" : "reservas"}</span>
              <span className="calendar-view__chip calendar-view__chip--event"><i aria-hidden="true" />{monthEvents} {monthEvents === 1 ? "evento" : "eventos"}</span>
            </div>
          </div>

          <div className="calendar-view__weekdays" aria-hidden="true">
            {weekdayNames.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className={`calendar-view__grid${loading ? " calendar-view__grid--loading" : ""}`}>
            {days.map((day) => {
              const dayItems = itemsByDate[day.key] || [];
              const classes = ["calendar-view__day"];
              if (day.outside) classes.push("calendar-view__day--outside");
              if (day.key === todayKey) classes.push("calendar-view__day--today");
              if (day.key === selectedDate) classes.push("calendar-view__day--selected");
              if ([0, 6].includes(day.date.getDay())) classes.push("calendar-view__day--weekend");
              return (
                <button key={day.key} type="button" className={classes.join(" ")} onClick={() => selectDay(day)}
                  aria-pressed={day.key === selectedDate}
                  aria-label={`${longDay(day.date)}${day.key === todayKey ? ", hoy" : ""}: ${dayItems.length ? `${dayItems.length} ${dayItems.length === 1 ? "actividad" : "actividades"}` : "sin actividades"}`}>
                  <span className="calendar-view__number">{day.date.getDate()}</span>
                  <span className="calendar-view__items">
                    {dayItems.slice(0, 2).map((item) => (
                      <span key={`${item.kind}-${item.id}`} className={`calendar-view__item calendar-view__item--${item.kind}`}>
                        <b>{item.start}</b> {item.label}
                      </span>
                    ))}
                    {dayItems.length > 2 && <span className="calendar-view__more">+{dayItems.length - 2} más</span>}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="calendar-view__dots" aria-hidden="true">
                      {dayItems.slice(0, 3).map((item) => <i key={`${item.kind}-${item.id}`} className={`calendar-view__dot--${item.kind}`} />)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </article>

        <aside className="calendar-view__aside">
          <article className="calendar-view__agenda">
            <div className="calendar-view__date">
              <span className="calendar-view__date-number">{selected.getDate()}</span>
              <div>
                <span className="panel__eyebrow">{selectedDate === todayKey ? "HOY" : "AGENDA DEL DÍA"}</span>
                <h3>{longDay(selected)}</h3>
                <small>{selectedItems.length ? `${selectedItems.length} ${selectedItems.length === 1 ? "actividad" : "actividades"}` : "Sin actividades"} · {selected.getFullYear()}</small>
              </div>
            </div>

            {selectedItems.length ? (
              <ol className="calendar-view__list">
                {selectedItems.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className={`calendar-view__entry calendar-view__entry--${item.kind}`}>
                    <span className="calendar-view__entry-icon"><Icon name={item.kind === "reservation" ? "reservations" : "events"} size={17} /></span>
                    <div>
                      <span className="calendar-view__entry-tag">{item.kind === "reservation" ? "Reserva" : "Evento"} · {item.detail}</span>
                      <strong>{item.label}</strong>
                      <small><Icon name="clock" size={13} /> {item.time}{item.location ? <> · <Icon name="location" size={13} /> {item.location}</> : null}</small>
                    </div>
                    <Link to={item.to} className="records-action" aria-label={`Abrir ${item.label}`} title="Abrir"><Icon name="arrowUpRight" size={15} /></Link>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="calendar-view__empty">
                <Icon name="calendar" size={24} />
                <p>No hay actividades programadas para este día.</p>
                <Link to="/reservations">Reservar un espacio <Icon name="arrowRight" size={14} /></Link>
              </div>
            )}
          </article>

          <article className="calendar-view__upcoming">
            <h3><Icon name="clock" size={16} /> Próximas actividades</h3>
            {upcoming.length ? (
              <ul>
                {upcoming.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <button type="button" onClick={() => setSelectedDate(item.key)}>
                      <i className={`calendar-view__dot--${item.kind}`} aria-hidden="true" />
                      <span><strong>{item.label}</strong><small>{shortDay(new Date(`${item.key}T12:00:00`))} · {item.start}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay actividades próximas en las fechas visibles.</p>
            )}
          </article>
        </aside>
      </section>
    </main>
  );
}

export default Calendar;
