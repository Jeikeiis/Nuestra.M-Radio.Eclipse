"use client";
import { useContext, useEffect } from "react";
import "./ThemeToggle.css";

// Importa el contexto de tema global
import { ThemeContext } from "@/context/AppContexts";

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const root = document.documentElement;

    // Añadir clase transitoria para evitar parpadeos
    root.classList.add("transitioning-theme");

    // Pequeño timeout para permitir que la clase transitoria tenga efecto
    setTimeout(() => {
      if (darkMode) {
        root.classList.add("dark");
        root.classList.remove("light");
        localStorage.setItem("theme", "dark");
      } else {
        root.classList.remove("dark");
        root.classList.remove("light");
        localStorage.setItem("theme", "light");
      }

      // Eliminar la clase transitoria después de completar los cambios
      setTimeout(() => {
        root.classList.remove("transitioning-theme");
      }, 100);
    }, 10);
  }, [darkMode]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Cambiar modo claro/oscuro"
    >
      <span className="icon-sun-moon" aria-hidden="true">
        <span className="eclipse-container animated">
          {/* Halo de la luna (debe estar detrás de la luna y el sol) */}
          <span className="eclipse-moon-halo animated" />
          {/* Sol */}
          <span className="eclipse-sun animated" />
          {/* Rayos del sol */}
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="eclipse-ray animated"
              style={{
                transform: `rotate(${i * 45}deg) translate(9px, -1px)`,
              }}
            />
          ))}
          {/* Luna/Eclipse */}
          <span className="eclipse-moon animated" />
        </span>
      </span>
    </button>
  );
}