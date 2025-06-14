"use client";
import { useContext, useEffect } from "react";
import "./ThemeToggle.css";

// Importa el contexto de tema global
import { ThemeContext } from "../app/layout"; // Corrige la ruta al contexto real

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
      className={`theme-toggle-btn px-4 py-2 rounded font-semibold transition-all
      bg-transparent hover:bg-gray-100 dark:bg-transparent dark:hover:bg-orange-900 w-[48px] h-[48px] flex items-center justify-center shadow-none`}
      onClick={() => setDarkMode((v: boolean) => !v)}
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
                transform: `rotate(${i * 45}deg) translate(12px, -1px)`,
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