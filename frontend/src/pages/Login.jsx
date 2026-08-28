import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTheme from "../hooks/useTheme";
import heroImage from "../assets/hero.png";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (localStorage.getItem("uniajs-smart-campus-auth") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    setError("");
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const email = form.email.trim();
    const password = form.password.trim();

    if (!email || !password) {
      setError("Ingresa tu correo institucional y contraseña para continuar.");
      return;
    }

    if (!email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);
    setError("");

    window.setTimeout(() => {
      localStorage.setItem("uniajs-smart-campus-auth", "true");

      if (remember) {
        localStorage.setItem("uniajs-smart-campus-user", email);
      } else {
        localStorage.removeItem("uniajs-smart-campus-user");
      }

      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    }, 700);
  };

  return (
    <main className="login-page">
      <section className="login-page__visual" aria-label="Uniajs Smart Campus">
        <div className="login-page__visual-glow login-page__visual-glow--one" />
        <div className="login-page__visual-glow login-page__visual-glow--two" />

        <div className="login-page__visual-top">
          <div className="login-brand">
            <span className="login-brand__mark">U</span>
            <span>
              <strong>Uniajs</strong>
              <small>SMART CAMPUS</small>
            </span>
          </div>

          <button
            type="button"
            className="login-theme"
            onClick={toggleTheme}
            aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
          >
            <span>{theme === "light" ? "☾" : "☀"}</span>
            {theme === "light" ? "Modo oscuro" : "Modo claro"}
          </button>
        </div>

        <div className="login-page__visual-content">
          <div className="login-page__eyebrow">
            <span /> Plataforma universitaria integrada
          </div>
          <h1>
            Todo tu campus,
            <br />
            <em>en un solo lugar.</em>
          </h1>
          <p>
            Gestiona solicitudes, reservas, recursos, eventos y notificaciones
            desde una experiencia digital pensada para la comunidad Uniajs.
          </p>

          <div className="login-page__features">
            <div>
              <span>01</span>
              <p><strong>Servicios</strong><br />universitarios centralizados</p>
            </div>
            <div>
              <span>02</span>
              <p><strong>Gestión</strong><br />simple y organizada</p>
            </div>
            <div>
              <span>03</span>
              <p><strong>Conectividad</strong><br />desde cualquier dispositivo</p>
            </div>
          </div>
        </div>

        <img className="login-page__orb" src={heroImage} alt="" aria-hidden="true" />

        <div className="login-page__visual-footer">
          <span>Universidad Antonio José de Sucre</span>
          <span>•</span>
          <span>Smart Campus</span>
        </div>
      </section>

      <section className="login-page__form-area">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <span className="login-brand__mark">U</span>
            <span>
              <strong>Uniajs</strong>
              <small>SMART CAMPUS</small>
            </span>
          </div>

          <div className="login-form__header">
            <span className="login-form__label">ACCESO SEGURO</span>
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para acceder a Smart Campus.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="login-field">
              <span>Correo electrónico</span>
              <div className="login-field__control">
                <span className="login-field__icon">@</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nombre@uniajs.edu.co"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </label>

            <label className="login-field">
              <span>Contraseña</span>
              <div className="login-field__control">
                <span className="login-field__icon">●</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-field__toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>

            <div className="login-form__options">
              <label className="login-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Recordarme</span>
              </label>
              <button type="button" className="login-link" onClick={() => setError("La recuperación de acceso estará disponible cuando se conecte el servicio de autenticación.")}>¿Olvidaste tu contraseña?</button>
            </div>

            {error && (
              <div className="login-alert" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button className="login-submit" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="login-submit__spinner" /> Verificando acceso...
                </>
              ) : (
                <>Iniciar sesión <span>→</span></>
              )}
            </button>
          </form>

          <div className="login-security">
            <span>⌁</span>
            <p><strong>Acceso protegido</strong><br />Tus credenciales serán gestionadas de forma segura.</p>
          </div>

          <p className="login-form__footer">
            © {new Date().getFullYear()} Uniajs Smart Campus · Plataforma académica
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
