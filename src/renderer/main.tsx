// main.tsx (updated)
import ReactDOM from "react-dom/client";
import "./styles/App.css";
import "./styles/App-dark.css";
// import './styles/scrollbar.css';
// import './styles/windows-friendly.css';
import "reflect-metadata";
import React from "react";
import ConditionalRouter from "./components/Shared/ConditionalRouter";
import App from "./routes/App";
import { SettingsProvider } from "./contexts/SettingsContext"; // adjust path

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SettingsProvider>
      <ConditionalRouter>
        <App />
      </ConditionalRouter>
    </SettingsProvider>
  </React.StrictMode>,
);

// main.tsx (idagdag sa itaas bago ang ReactDOM.createRoot)
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || savedTheme === "light") {
  document.documentElement.setAttribute("data-theme", savedTheme);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.setAttribute("data-theme", "dark");
} else {
  document.documentElement.setAttribute("data-theme", "light");
}
