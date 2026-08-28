import { useMemo, useState } from "react";

import { reservations as initialReservations } from "../data/mockData";
import ReservationCard from "../components/ReservationCard/ReservationCard";
import useLocalStorage from "../hooks/useLocalStorage";

const filters = ["TODAS", "CONFIRMADA", "PENDIENTE", "FINALIZADA", "CANCELADA"];

const emptyForm = {
  resource: "",
  type: "Sala",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
};

function Reservations() {
  const [reservations, setReservations] = useLocalStorage(
    "uajs_reservations",
    initialReservations
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const filteredReservations = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return reservations.filter((reservation) => {
      const matchesFilter =
        filter === "TODAS" || reservation.status === filter;

      const searchable = [
        reservation.resource,
        reservation.type,
        reservation.location,
        reservation.description,
        reservation.id,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchable.includes(normalizedSearch);
    });
  }, [filter, reservations, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.resource.trim() ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.location.trim()
    ) {
      setError("Completa todos los campos para registrar la reserva.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("La hora de finalización debe ser posterior a la hora de inicio.");
      return;
    }

    const newReservation = {
      id: Date.now(),
      resource: form.resource.trim(),
      type: form.type,
      date: new Date(`${form.date}T00:00:00`).toLocaleDateString("es-CO"),
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      status: "PENDIENTE",
      description: "Reserva registrada desde Uniajs Smart Campus.",
    };

    setReservations((current) => [newReservation, ...current]);
    setForm(emptyForm);
    setError("");
    setIsFormOpen(false);
  };

  const handleCancel = (id) => {
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === id
          ? { ...reservation, status: "CANCELADA" }
          : reservation
      )
    );
  };

  return (
    <main className="reservations-page">
      <section className="reservations-page__hero">
        <div>
          <span className="reservations-page__eyebrow">GESTIÓN UNIVERSITARIA</span>
          <h1>Mis reservas</h1>
          <p>
            Gestiona salas, laboratorios, equipos y espacios académicos desde un solo lugar.
          </p>
        </div>

        <button
          className="reservations-page__new-button"
          type="button"
          onClick={() => {
            setIsFormOpen((open) => !open);
            setError("");
          }}
        >
          <span aria-hidden="true">＋</span>
          Nueva reserva
        </button>
      </section>

      {isFormOpen && (
        <section className="reservations-form panel">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">NUEVA RESERVA</span>
              <h2>Programa tu espacio o recurso</h2>
            </div>

            <button
              className="reservations-form__close"
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="Cerrar formulario"
            >
              ×
            </button>
          </div>

          <form className="reservations-form__body" onSubmit={handleSubmit}>
            <div className="reservations-form__grid">
              <label>
                <span>Recurso o espacio</span>
                <input
                  name="resource"
                  value={form.resource}
                  onChange={handleChange}
                  placeholder="Ej. Sala 305"
                />
              </label>

              <label>
                <span>Tipo</span>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option>Sala</option>
                  <option>Laboratorio</option>
                  <option>Equipo</option>
                  <option>Auditorio</option>
                  <option>Espacio académico</option>
                </select>
              </label>

              <label>
                <span>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Ubicación</span>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Ej. Bloque A · Segundo piso"
                />
              </label>

              <label>
                <span>Hora de inicio</span>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Hora de finalización</span>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                />
              </label>
            </div>

            {error && <p className="reservations-form__error">{error}</p>}

            <div className="reservations-form__actions">
              <button
                className="reservations-form__cancel"
                type="button"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </button>
              <button className="reservations-form__submit" type="submit">
                Confirmar reserva
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="reservations-page__toolbar panel">
        <div className="reservations-page__search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por recurso, tipo o ubicación..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar reservas"
          />
        </div>

        <div className="reservations-page__filters" aria-label="Filtrar reservas">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={
                filter === item
                  ? "reservations-page__filter reservations-page__filter--active"
                  : "reservations-page__filter"
              }
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="reservations-page__content">
        <div className="reservations-page__section-heading">
          <div>
            <span className="panel__eyebrow">AGENDA</span>
            <h2>Reservas registradas</h2>
          </div>
          <span className="reservations-page__count">
            {filteredReservations.length}
          </span>
        </div>

        {filteredReservations.length > 0 ? (
          <div className="reservations-page__list">
            {filteredReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <div className="reservations-page__empty panel">
            <span>◷</span>
            <h3>No encontramos reservas</h3>
            <p>Prueba con otro filtro o registra una nueva reserva.</p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
            >
              Crear reserva
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Reservations;
