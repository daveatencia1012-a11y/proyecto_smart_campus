import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon/Icon";
import uajsLogo from "../assets/uajs-logo.png";

const institutionalLinks = [
  { label: "Sitio oficial", href: "https://www.uniajs.edu.co/" },
  { label: "Campus Virtual", href: "https://campus.uniajs.edu.co/" },
  { label: "Calendario académico", href: "https://www.uniajs.edu.co/calendario-academico" },
  { label: "Pagos online", href: "https://acratenew.corposucre.edu.co/pagos.php" },
  { label: "Portal de empleos", href: "https://empleos.corposucre.edu.co/" },
];

const features = [
  {
    number: "01",
    icon: "services",
    title: "Servicios",
    text: "Encuentra en segundos los servicios que necesitas dentro de tu comunidad universitaria.",
    image: "https://www.uniajs.edu.co/web/image/21433-29f150cf/Wireframe_Home%203_1.png",
  },
  {
    number: "02",
    icon: "requests",
    title: "Solicitudes",
    text: "Radica, consulta y haz seguimiento a tus solicitudes desde un mismo lugar.",
    image: "https://www.uniajs.edu.co/web/image/21432-6b00ed0a/college-girl-working-with-laptop-after-lessons.jpg",
  },
  {
    number: "03",
    icon: "reservations",
    title: "Reservas",
    text: "Gestiona espacios y recursos con una experiencia rápida y clara.",
    image: "https://www.uniajs.edu.co/web/image/21427-71dfa2d0/portrait-three-serious-students-studying-library.jpg",
  },
  {
    number: "04",
    icon: "events",
    title: "Eventos",
    text: "Descubre actividades, encuentros y experiencias que mantienen conectado al campus.",
    image: "https://www.uniajs.edu.co/web/image/21428-4fb9d6f4/medium-shot-couple-travel-agency.jpg",
  },
];

const highlights = [
  "Una experiencia digital pensada para la comunidad UNIAJS",
  "Acceso rápido a servicios, solicitudes y reservas",
  "Información organizada y notificaciones en un solo lugar",
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem("uniajs-smart-campus-auth") === "true");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".landing-reveal").forEach((element) => revealObserver.observe(element));

    const onPointerMove = (event) => {
      document.documentElement.style.setProperty("--landing-mx", `${event.clientX}px`);
      document.documentElement.style.setProperty("--landing-my", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      revealObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const campusPath = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="landing">
      <div className="landing__cursor-glow" aria-hidden="true" />
      <div className="landing__noise" aria-hidden="true" />

      <header className="landing-header">
        <div className="landing-header__top">
          <div className="landing-header__top-inner">
            <span>Corporación Universitaria Antonio José de Sucre</span>
            <div>
              <a href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">Reingresos</a>
              <a href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">Test Vocacional</a>
              <a href="https://campus.uniajs.edu.co/" target="_blank" rel="noreferrer">Campus Virtual</a>
            </div>
          </div>
        </div>

        <div className="landing-header__main">
          <div className="landing-header__main-inner">
            <a className="landing-brand" href="#inicio" aria-label="UNIAJS Smart Campus">
              <img className="landing-brand__logo" src={uajsLogo} alt="Corporación Universitaria Antonio José de Sucre" />
              <span className="landing-brand__product">SMART<br />CAMPUS</span>
            </a>

            <button
              className={`landing-header__menu ${menuOpen ? "landing-header__menu--open" : ""}`}
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>

            <nav className={`landing-nav ${menuOpen ? "landing-nav--open" : ""}`} aria-label="Navegación principal">
              <a href="#plataforma" onClick={() => setMenuOpen(false)}>Plataforma</a>
              <a href="#experiencia" onClick={() => setMenuOpen(false)}>Experiencia</a>
              <a href="#enlaces" onClick={() => setMenuOpen(false)}>Enlaces</a>
              <a className="landing-nav__campus" href={campusPath} onClick={() => setMenuOpen(false)}>
                {isAuthenticated ? "Mi Campus" : "Iniciar sesión"}
                <Icon name="arrowUpRight" size={16} />
              </a>
              <a className="landing-nav__enroll" href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">
                Inscríbete
              </a>
            </nav>
          </div>
        </div>
      </header>

      <section className="landing-hero" id="inicio">
        <div className="landing-hero__mesh" aria-hidden="true" />
        <div className="landing-hero__glow landing-hero__glow--one" aria-hidden="true" />
        <div className="landing-hero__glow landing-hero__glow--two" aria-hidden="true" />
        <div className="landing-hero__lines" aria-hidden="true"><i /><i /><i /></div>

        <div className="landing-container landing-hero__content">
          <div className="landing-hero__copy landing-reveal is-visible">
            <div className="landing-kicker">
              <span className="landing-kicker__dot" />
              UNIAJS · Smart Campus
            </div>
            <h1 className="landing-hero__title">
              Atrévete a descubrir la
              <span> mejor versión de tu campus.</span>
            </h1>
            <p className="landing-hero__lead">
              Una experiencia digital creada para conectar tu vida universitaria:
              servicios, solicitudes, reservas, eventos y comunicaciones, todo en un solo lugar.
            </p>

            <div className="landing-hero__actions">
              <Link className="landing-button landing-button--yellow" to={campusPath}>
                {isAuthenticated ? "Ir a mi Campus" : "Empieza aquí"}
                <Icon name="arrowRight" size={18} />
              </Link>
              <a className="landing-button landing-button--outline" href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">
                Conoce UNIAJS
                <Icon name="arrowUpRight" size={17} />
              </a>
            </div>

            <div className="landing-hero__microcopy">
              <span><i /> Acceso centralizado</span>
              <span><i /> Experiencia responsive</span>
              <span><i /> Comunidad UNIAJS</span>
            </div>
          </div>

          <div className="landing-hero__visual landing-reveal is-visible" style={{ "--reveal-delay": "120ms" }}>
            <div className="landing-visual__halo" aria-hidden="true" />
            <div className="landing-visual__ring landing-visual__ring--one" aria-hidden="true" />
            <div className="landing-visual__ring landing-visual__ring--two" aria-hidden="true" />
            <div className="landing-visual__ring landing-visual__ring--three" aria-hidden="true" />

            <div className="landing-campus-card landing-campus-card--back">
              <div><span>PRÓXIMO EVENTO</span><b>Feria de innovación</b></div>
              <small>Auditorio · 2:00 PM</small>
            </div>

            <div className="landing-campus-card landing-campus-card--main">
              <div className="landing-campus-card__shine" />
              <div className="landing-campus-card__top">
                <span>SMART CAMPUS</span>
                <span className="landing-status"><i /> En línea</span>
              </div>
              <div className="landing-campus-card__identity">
                <div className="landing-avatar">U</div>
                <div><strong>Tu espacio universitario</strong><span>Todo lo que necesitas, conectado.</span></div>
              </div>
              <div className="landing-campus-card__stats">
                <div><strong>08</strong><span>Servicios</span></div>
                <div><strong>04</strong><span>Reservas</span></div>
                <div><strong>12</strong><span>Eventos</span></div>
              </div>
              <div className="landing-campus-card__progress">
                <div><span>Actividad del campus</span><strong>78%</strong></div>
                <span className="landing-progress"><i /></span>
              </div>
            </div>

            <div className="landing-float landing-float--notification">
              <span><Icon name="bell" size={17} /></span>
              <div><strong>Todo al día</strong><small>3 novedades recientes</small></div>
            </div>
            <div className="landing-float landing-float--calendar">
              <span><Icon name="calendar" size={17} /></span>
              <div><strong>Hoy</strong><small>2 actividades programadas</small></div>
            </div>
            <div className="landing-float landing-float--status"><i /> Campus conectado</div>
          </div>
        </div>

        <div className="landing-hero__bottom">
          <div className="landing-container">
            <span>EXPERIENCIA DIGITAL UNIAJS</span>
            <div className="landing-hero__scroll"><i /> Desliza para explorar</div>
            <strong>01 / 04</strong>
          </div>
        </div>
      </section>

      <section className="landing-marquee" id="plataforma">
        <div className="landing-marquee__track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div key={copy}>
              <span>ESTUDIANTES</span><i />
              <span>DOCENTES</span><i />
              <span>ADMINISTRATIVOS</span><i />
              <span>COMUNIDAD UNIAJS</span><i />
              <span>SMART CAMPUS</span><i />
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--features">
        <div className="landing-container">
          <div className="landing-section__heading landing-reveal">
            <div>
              <span className="landing-section__eyebrow">UNA EXPERIENCIA, TODO EL CAMPUS</span>
              <h2>Todo lo que necesitas.<br /><em>Más cerca de ti.</em></h2>
            </div>
            <p>Smart Campus transforma las tareas cotidianas en una experiencia simple, visual y conectada con la comunidad universitaria.</p>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature, index) => (
              <article className="landing-feature landing-reveal" style={{ "--reveal-delay": `${index * 70}ms` }} key={feature.number}>
                <div className="landing-feature__image" aria-hidden="true">
                  <img src={feature.image} alt="" loading="lazy" />
                  <span className="landing-feature__image-overlay" />
                </div>
                <div className="landing-feature__top">
                  <span className="landing-feature__number">{feature.number}</span>
                  <span className="landing-feature__icon"><Icon name={feature.icon} size={22} /></span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className="landing-feature__line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--experience" id="experiencia">
        <div className="landing-container landing-experience">
          <div className="landing-experience__visual landing-reveal">
            <div className="landing-experience__badge"><span /> EXPERIENCIA EN TIEMPO REAL</div>
            <div className="landing-experience__panel">
              <div className="landing-experience__panel-head"><span>MI CAMPUS</span><span>HOY · 13 SEP</span></div>
              <div className="landing-experience__welcome"><span>Buenos días, comunidad 👋</span><strong>¿Qué necesitas hacer?</strong></div>
              <div className="landing-experience__quick">
                <span><Icon name="requests" size={19} /> Solicitud</span>
                <span><Icon name="reservations" size={19} /> Reserva</span>
                <span><Icon name="events" size={19} /> Evento</span>
              </div>
              <div className="landing-experience__activity">
                <div><span className="landing-mini-icon"><Icon name="checkCircle" size={17} /></span><div><strong>Solicitud aprobada</strong><small>Certificado académico</small></div><time>10:42</time></div>
                <div><span className="landing-mini-icon"><Icon name="calendar" size={17} /></span><div><strong>Reserva confirmada</strong><small>Sala de estudio · 3:00 PM</small></div><time>09:18</time></div>
              </div>
            </div>
          </div>

          <div className="landing-experience__copy landing-reveal" style={{ "--reveal-delay": "120ms" }}>
            <span className="landing-section__eyebrow">HECHO PARA TU DÍA A DÍA</span>
            <h2>Menos pasos.<br /><em>Más tiempo para ti.</em></h2>
            <p>Una plataforma que entiende el ritmo de la vida universitaria y convierte cada gestión en una experiencia más clara.</p>
            <ul>
              {highlights.map((item) => <li key={item}><span><Icon name="check" size={15} /></span>{item}</li>)}
            </ul>
            <Link className="landing-text-link" to={campusPath}>Explorar Smart Campus <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="landing-institutional landing-reveal" id="enlaces">
        <div className="landing-institutional__ambient" aria-hidden="true">
          <span className="landing-institutional__orb landing-institutional__orb--one" />
          <span className="landing-institutional__orb landing-institutional__orb--two" />
          <span className="landing-institutional__grid-lines" />
        </div>

        <div className="landing-container landing-institutional__grid">
          <div className="landing-institutional__intro">
            <div className="landing-institutional__eyebrow-row">
              <span className="landing-section__eyebrow">CONEXIÓN INSTITUCIONAL</span>
              <span className="landing-institutional__live"><i /> Canales oficiales</span>
            </div>
            <h2>Tu campus no termina aquí.</h2>
            <p>Un solo punto de entrada para continuar tu experiencia UNIAJS fuera del Smart Campus.</p>

            <div className="landing-institutional__visual">
              <div className="landing-institutional__visual-glow" />
              <div className="landing-institutional__visual-ring landing-institutional__visual-ring--one" />
              <div className="landing-institutional__visual-ring landing-institutional__visual-ring--two" />
              <div className="landing-institutional__image-card">
                <img src={uajsLogo} alt="UNIAJS" />
                <span>Corporación Universitaria<br />Antonio José de Sucre</span>
              </div>
              <div className="landing-institutional__mini-card landing-institutional__mini-card--top">
                <Icon name="checkCircle" size={16} />
                <div><strong>Institucional</strong><small>Información oficial</small></div>
              </div>
              <div className="landing-institutional__mini-card landing-institutional__mini-card--bottom">
                <span>5</span><div><strong>Canales</strong><small>Siempre disponibles</small></div>
              </div>
            </div>
          </div>

          <div className="landing-institutional__portal">
            <div className="landing-institutional__portal-head">
              <div><span>EXPLORA</span><strong>Tu ecosistema UNIAJS</strong></div>
              <span className="landing-institutional__count">05 enlaces</span>
            </div>
            <div className="landing-institutional__links">
              {institutionalLinks.map((link, index) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                  <span className="landing-institutional__link-number">0{index + 1}</span>
                  <span className="landing-institutional__link-icon"><Icon name={index === 0 ? "globe" : index === 1 ? "graduation" : index === 2 ? "calendar" : index === 3 ? "creditCard" : "briefcase"} size={18} /></span>
                  <span className="landing-institutional__link-copy"><strong>{link.label}</strong><small>{index === 0 ? "Conoce nuestra universidad" : index === 1 ? "Accede a tu plataforma académica" : index === 2 ? "Consulta fechas y actividades" : index === 3 ? "Gestiona tus pagos" : "Oportunidades profesionales"}</small></span>
                  <span className="landing-institutional__link-arrow"><Icon name="arrowUpRight" size={17} /></span>
                </a>
              ))}
            </div>
            <div className="landing-institutional__portal-foot">
              <span><i /> Sitios verificados de UNIAJS</span>
              <a href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">Visitar uniajs.edu.co <Icon name="arrowUpRight" size={14} /></a>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__grid" aria-hidden="true" />
        <div className="landing-cta__glow" aria-hidden="true" />
        <div className="landing-container landing-cta__inner landing-reveal">
          <div>
            <span className="landing-section__eyebrow">ATRÉVETE A INICIAR</span>
            <h2>Tu próximo paso<br /><em>empieza aquí.</em></h2>
          </div>
          <div className="landing-cta__action">
            <p>Conecta con tu campus y descubre una experiencia universitaria diseñada para ti.</p>
            <Link className="landing-button landing-button--yellow" to={campusPath}>
              {isAuthenticated ? "Ir al Campus" : "Ingresar al Campus"}
              <Icon name="arrowUpRight" size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer" id="enlaces">
        <div className="landing-container">
          <div className="landing-footer__top">
            <div className="landing-footer__brand">
              <img src={uajsLogo} alt="UNIAJS" />
              <span className="landing-footer__tag">SMART CAMPUS</span>
              <p>Corporación Universitaria Antonio José de Sucre.<br />Formamos profesionales que transforman su realidad.</p>
            </div>
            <div className="landing-footer__links">
              <div><span>PLATAFORMA</span><Link to={campusPath}>Smart Campus</Link><Link to="/login">Iniciar sesión</Link></div>
              <div><span>UNIAJS</span>{institutionalLinks.slice(0, 3).map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
              <div><span>RECURSOS</span>{institutionalLinks.slice(3).map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}</div>
            </div>
          </div>
          <div className="landing-footer__bottom">
            <span>© {new Date().getFullYear()} UNIAJS · Smart Campus</span>
            <span>Vigilada Mineducación · SNIES 2850</span>
            <a href="https://www.uniajs.edu.co/" target="_blank" rel="noreferrer">uniajs.edu.co <Icon name="arrowUpRight" size={14} /></a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Landing;
