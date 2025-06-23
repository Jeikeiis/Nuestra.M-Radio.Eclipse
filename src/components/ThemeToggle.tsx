"use client";
import { useContext, useEffect } from "react";
import "./ThemeToggle.css";

// Importa el contexto de tema global
import { ThemeContext } from "@/context/AppContexts";

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      // Elimina la clase light si existe
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      // No agregues la clase light, el modo claro es el predeterminado
      root.classList.remove("light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setDarkMode(!darkMode)}
      aria-label="Cambiar modo claro/oscuro"
    >
      <span className="icon-sun-moon" aria-hidden="true">
        <span className="eclipse-container">
          {/* Halo de la luna (debe estar detrás de la luna y el sol) */}
          <span className="eclipse-moon-halo" />
          {/* Sol */}
          <span className="eclipse-sun" />
          {/* Rayos del sol */}
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="eclipse-ray"
              style={{
                transform: `rotate(${i * 45}deg) translate(9px, -1px)`,
              }}
            />
          ))}
          {/* Luna/Eclipse */}
          <span className="eclipse-moon" />
        </span>
      </span>
    </button>
  );
}