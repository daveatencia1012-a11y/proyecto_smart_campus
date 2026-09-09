import uajsLogo from "../../assets/uajs-logo.png";
import Icon from "../Icon/Icon";

function LoadingScreen({ message = "Preparando tu espacio universitario..." }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label="Cargando Smart Campus">
      <div className="loading-screen__ambient loading-screen__ambient--one" />
      <div className="loading-screen__ambient loading-screen__ambient--two" />

      <div className="loading-screen__content">
        <div className="loading-screen__logo-wrap">
          <span className="loading-screen__ring loading-screen__ring--outer" />
          <span className="loading-screen__ring loading-screen__ring--inner" />
          <div className="loading-screen__logo">
            <img src={uajsLogo} alt="UAJS Smart Campus" />
          </div>
        </div>

        <span className="loading-screen__eyebrow">UAJS SMART CAMPUS</span>
        <h1>Iniciando tu campus digital</h1>
        <p>{message}</p>

        <div className="loading-screen__progress" aria-hidden="true">
          <span />
        </div>

        <div className="loading-screen__status">
          <Icon name="shield" size={15} />
          <span>Sesión segura · Conectando tus servicios</span>
          <span className="loading-screen__dots"><i /><i /><i /></span>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
