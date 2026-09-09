import useTheme from "../../hooks/useTheme";
import Icon from "../Icon/Icon";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <Icon name={isDark ? "sun" : "moon"} size={18} />
      </span>

      <span className="theme-toggle__label">
        {isDark ? "Claro" : "Oscuro"}
      </span>
    </button>
  );
}

export default ThemeToggle;
