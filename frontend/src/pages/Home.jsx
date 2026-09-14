import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";

const shortcuts = [
  { icon: "services", title: "Servicios", text: "Explora los servicios disponibles.", to: "/services" },
  { icon: "requests", title: "Solicitudes", text: "Consulta y gestiona tus solicitudes.", to: "/requests" },
  { icon: "reservations", title: "Reservas", text: "Administra espacios y recursos.", to: "/reservations" },
  { icon: "events", title: "Eventos", text: "Descubre actividades del campus.", to: "/events" },
];

function Home() {
  return (
    <section className="home-page">
      <div className="home-page__hero panel">
        <span className="panel__eyebrow">INICIO · SMART CAMPUS</span>
        <h1 className="home-page__title">Todo lo que necesitas para vivir tu campus.</h1>
        <p className="home-page__text">Accede rápidamente a tus servicios, solicitudes, reservas y actividades desde un mismo espacio.</p>
        <Link className="home-page__action" to="/dashboard">Ir a mi dashboard <Icon name="arrowRight" size={16} /></Link>
      </div>
      <div className="home-page__grid">
        {shortcuts.map((item) => (
          <Link className="home-page__card panel" to={item.to} key={item.title}>
            <span className="home-page__icon"><Icon name={item.icon} size={21} /></span>
            <span className="home-page__card-title">{item.title}</span>
            <span className="home-page__card-text">{item.text}</span>
            <Icon name="arrowUpRight" size={16} className="home-page__arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Home;
