import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon/Icon";
import ReservationCard from "../components/ReservationCard/ReservationCard";
import { getReservations, createReservation, cancelReservation } from "../services/reservationsService";
import { getResources } from "../services/resourcesService";

const filters = ["TODAS", "CONFIRMADA", "PENDIENTE", "FINALIZADA", "CANCELADA"];

const emptyForm = {
  recurso_id: "",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
};

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [resourcesList, setResourcesList] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODAS");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [reservasData, recursosData] = await Promise.all([
        getReservations(),
        getResources(),
      ]);
      setReservations(reservasData);
      setResourcesList(recursosData);
    } catch (err) {
      setError(err.message || "Error al cargar las reservas.");
    } finally {
      setLoading(false);
    }
  }

  const filteredReservations = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();
    return reservations.filter((reservation) => {
      const matchesFilter = filter === "TODAS" || reservation.status === filter;
      const searchable = `${reservation.resource} ${reservation.type} ${reservation.location} ${reservation.date}`.toLowerCase();
      return matchesFilter && searchable.includes(normalizedSearch);
    });
  }, [filter, reservations, search]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.recurso_id || !form.fecha || !form.hora_inicio || !form.hora_fin) {
      setError("Completa todos los campos para registrar la reserva.");
      return;
    }
    if (form.hora_inicio >= form.hora_fin) {
      setError("La hora de inicio debe ser menor que la hora de fin.");
      return;
    }

    try {
      setError("");
      await createReservation({
        recurso_id: Number(form.recurso_id),
        fecha: form.fecha,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
      });
      setForm(emptyForm);
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || "Error al crear la reserva.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelReservation(id);
      setReservations((current) =>
        current.map((r) => (r.id === id ? { ...r, status: "CANCELADA" } : r))
      );
    } catch (err) {
      setError(err.message || "Error al cancelar la reserva.");
    }
  };

  return (
    <main className="reservations-page">
      <section className="reservations-page__hero">
        <div>
          <span className="reservations-page__eyebrow">GESTIÓN UNIVERSITARIA</span>
          <h1>Mis reservas</h1>
          <p>Gestiona salas, laboratorios, equipos y espacios académicos desde un solo lugar.</p>
        </div>
        <button className="reservations-page__new-button" type="button" onClick={() => { setIsFormOpen((open) => !open); setError(""); }}>
          <Icon name="plus" size={18} />
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
            <button className="reservations-form__close" type="button" onClick={() => setIsFormOpen(false)} aria-label="Cerrar formulario">
              <Icon name="close" size={18} />
            </button>
          </div>
          <form className="reservations-form__body" onSubmit={handleSubmit}>
            <div className="reservations-form__grid">
              <label>
                <span>Recurso o espacio</span>
                <select name="recurso_id" value={form.recurso_id} onChange={handleChange}>
                  <option value="">Selecciona un recurso</option>
                  {resourcesList.filter((r) => r.status === "DISPONIBLE").map((r) => (
                    <option key={r.id} value={r.id}>{r.name} · {r.location}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Fecha</span>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />
              </label>
              <label>
                <span>Hora de inicio</span>
                <input type="time" name="hora_inicio" value={form.hora_inicio} onChange={handleChange} />
              </label>
              <label>
                <span>Hora de finalización</span>
                <input type="time" name="hora_fin" value={form.hora_fin} onChange={handleChange} />
              </label>
            </div>
            {error && <p className="reservations-form__error">{error}</p>}
            <div className="reservations-form__actions">
              <button className="reservations-form__cancel" type="button" onClick={() => setIsFormOpen(false)}>Cancelar</button>
              <button className="reservations-form__submit" type="submit">Confirmar reserva</button>
            </div>
          </form>
        </section>
      )}

      <section className="reservations-page__toolbar panel">
        <div className="reservations-page__search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Buscar por recurso, tipo o ubicación..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar reservas" />
        </div>
        <div className="reservations-page__filters" aria-label="Filtrar reservas">
          {filters.map((item) => (
            <button key={item} type="button" className={filter === item ? "reservations-page__filter reservations-page__filter--active" : "reservations-page__filter"} onClick={() => setFilter(item)}>
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
          <span className="reservations-page__count">{filteredReservations.length}</span>
        </div>

        {loading ? (
          <div className="reservations-page__empty panel"><p>Cargando reservas...</p></div>
        ) : error ? (
          <div className="reservations-page__empty panel">
            <p>{error}</p>
            <button type="button" onClick={loadData}>Reintentar</button>
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className="reservations-page__list">
            {filteredReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} onCancel={handleCancel} />
            ))}
          </div>
        ) : (
          <div className="reservations-page__empty panel">
            <Icon name="clock" size={18} />
            <h3>No encontramos reservas</h3>
            <p>Prueba con otro filtro o registra una nueva reserva.</p>
            <button type="button" onClick={() => setIsFormOpen(true)}>Crear reserva</button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Reservations;