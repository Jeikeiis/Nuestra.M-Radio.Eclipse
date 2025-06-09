"use client";
import { useEffect, useState } from "react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(true); // Modo oscuro por defecto

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
    else setDarkMode(true); // Si no hay preferencia, oscuro
  }, []);

  useEffect(() => {
    const root = document.documentElement; // Usar <html> para Tailwind
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      className={`theme-toggle-btn px-4 py-2 rounded font-semibold transition-all
      bg-transparent hover:bg-gray-100 dark:bg-transparent dark:hover:bg-orange-900 w-[48px] h-[48px] flex items-center justify-center shadow-none`}
      onClick={() => setDarkMode((v) => !v)}
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