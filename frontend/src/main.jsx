import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import './styles/roles.css';
import App from "./App.jsx";
import ThemeProvider from "./components/ThemeProvider/ThemeProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
