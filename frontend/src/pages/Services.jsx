import { services } from "../data/mockData";
import ServiceCard from "../components/ServiceCard/ServiceCard";

function Services() {
  return (
    <main className="service-page services-page">
      <section className="service-page__hero">
        <div>
          <span className="service-page__eyebrow">SMART CAMPUS</span>
          <h1>Servicios universitarios</h1>
          <p>Accede desde un solo lugar a las funcionalidades principales de Uniajs Smart Campus.</p>
        </div>
      </section>
      <section className="panel services-page__catalog">
        <div className="panel__header"><div><span className="panel__eyebrow">CATÁLOGO</span><h2>Todos los servicios</h2></div><span className="service-page__count">{services.length}</span></div>
        <div className="services-page__grid">
          {services.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      </section>
    </main>
  );
}
export default Services;
