import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "../../context/ThemeContext";

const STORAGE_KEY = "uajs-smart-campus-theme";

function getInitialTheme() {
  let savedTheme;
  try { savedTheme = localStorage.getItem(STORAGE_KEY); } catch { /* usar preferencia del sistema */ }

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* tema en memoria */ }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => {
        setTheme((currentTheme) =>
          currentTheme === "light" ? "dark" : "light"
        );
      },
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
