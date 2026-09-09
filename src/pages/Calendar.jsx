import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { events, reservations } from "../data/mockData";
import useLocalStorage from "../hooks/useLocalStorage";
import Icon from "../components/Icon/Icon";

const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const weekdayNames = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

function toReservationDate(value) {
  const [day, month, year] = value.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function Calendar() {
  const [storedReservations] = useLocalStorage("uajs_reservations", reservations);
  const [storedEvents] = useLocalStorage("uajs_events", events);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const mondayIndex = (first.getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const previousTotal = new Date(year, month, 0).getDate();
    const cells = [];

    for (let i = mondayIndex - 1; i >= 0; i -= 1) {
      const date = new Date(year, month - 1, previousTotal - i);
      cells.push({ date, outside: true });
    }
    for (let day = 1; day <= total; day += 1) {
      cells.push({ date: new Date(year, month, day), outside: false });
    }
    while (cells.length < 42) {
      const date = new Date(year, month + 1, cells.length - total - mondayIndex + 1);
      cells.push({ date, outside: true });
    }
    return cells;
  }, [cursor]);

  const itemsByDate = useMemo(() => {
    const map = {};
    storedReservations.forEach((item) => {
      const key = toReservationDate(item.date);
      if (!map[key]) map[key] = [];
      map[key].push({ ...item, kind: "reservation", label: item.resource, time: `${item.startTime} – ${item.endTime}` });
    });
    storedEvents.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push({ ...item, kind: "event", label: item.title, time: item.time });
    });
    return map;
  }, [storedReservations, storedEvents]);

  const selectedItems = itemsByDate[selectedDate] || [];
  const selected = new Date(`${selectedDate}T12:00:00`);

  const formatSelected = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "numeric", month: "long"
  }).format(selected);

  const changeMonth = (offset) => {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  };

  return (
    <main className="calendar-page">
      <section className="calendar-page__hero">
        <div>
          <span className="calendar-page__eyebrow">AGENDA SMART CAMPUS</span>
          <h1>Calendario universitario</h1>
          <p>Organiza en una sola vista tus reservas y actividades institucionales. Selecciona un día para consultar el detalle.</p>
        </div>
        <div className="calendar-page__actions">
          <button className="calendar-page__button" type="button" onClick={goToday}>
            <Icon name="calendar" size={17} /> Hoy
          </button>
          <Link className="calendar-page__button calendar-page__button--primary" to="/reservations">
            <Icon name="plus" size={17} /> Nueva reserva
          </Link>
        </div>
      </section>

      <section className="calendar-page__layout">
        <article className="panel calendar">
          <div className="calendar__toolbar">
            <div className="calendar__month">
              <button className="calendar__nav" type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior"><Icon name="arrowLeft" size={16} /></button>
              <h2>{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</h2>
              <button className="calendar__nav" type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente"><Icon name="arrowRight" size={16} /></button>
            </div>
            <div className="calendar__legend">
              <span><i className="calendar__dot" /> Reservas</span>
              <span><i className="calendar__dot calendar__dot--event" /> Eventos</span>
              <span><i className="calendar__dot calendar__dot--today" /> Hoy</span>
            </div>
          </div>

          <div className="calendar__weekdays">
            {weekdayNames.map((day) => <span className="calendar__weekday" key={day}>{day}</span>)}
          </div>

          <div className="calendar__grid">
            {days.map(({ date, outside }) => {
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const dayItems = itemsByDate[key] || [];
              const isToday = key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              return (
                <button
                  className={`calendar__day ${outside ? "calendar__day--outside" : ""} ${key === selectedDate ? "calendar__day--selected" : ""} ${isToday ? "calendar__day--today" : ""}`}
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="calendar__number">{date.getDate()}</span>
                  <span className="calendar__items">
                    {dayItems.slice(0, 2).map((item) => (
                      <span className={`calendar__item ${item.kind === "event" ? "calendar__item--event" : ""}`} key={`${item.kind}-${item.id}`}>
                        {item.kind === "reservation" ? "Reserva · " : "Evento · "}{item.label}
                      </span>
                    ))}
                    {dayItems.length > 2 && <span className="calendar__more">+{dayItems.length - 2} más</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <aside className="calendar__aside">
          <article className="panel calendar__selected">
            <span className="panel__eyebrow">AGENDA DEL DÍA</span>
            <div className="calendar__selected-date">
              <span className="calendar__selected-number">{selected.getDate()}</span>
              <div><small>{selected.getFullYear()}</small><h3>{formatSelected}</h3></div>
            </div>

            {selectedItems.length ? (
              <div className="calendar__agenda">
                {selectedItems.map((item) => (
                  <div className="calendar__agenda-item" key={`${item.kind}-${item.id}`}>
                    <span className="calendar__agenda-tag">{item.kind === "reservation" ? "RESERVA" : "EVENTO"}</span>
                    <strong>{item.label}</strong>
                    <p>{item.time}<br />{item.location}</p>
                    {item.kind === "reservation" && <Link to={`/reservations/${item.id}`} className="form-helper">Ver reserva →</Link>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar__empty">
                <Icon name="calendar" size={24} />
                <p>No hay actividades programadas para este día.</p>
              </div>
            )}
          </article>

          <div className="calendar__tips">
            <strong>💡 Consejo</strong>
            <p>Usa el calendario para detectar rápidamente cruces de horario y planificar tus reservas alrededor de eventos institucionales.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default Calendar;
