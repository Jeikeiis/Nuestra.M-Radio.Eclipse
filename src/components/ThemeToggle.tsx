"use client";
import { useEffect, useState } from "react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    else setDarkMode(false);
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
        {/* Eclipse animado */}
        <span className="eclipse-container">
          {/* Sol */}
          <span className="eclipse-sun" />
          {/* Luna/Eclipse */}
          <span className="eclipse-moon" />
          {/* Rayos del sol eclipsado */}
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="eclipse-ray"
              style={{
                transform: `rotate(${i * 30}deg) translate(18px, 0)`,
              }}
            />
          ))}
        </span>
      </span>
    </button>
  );
}