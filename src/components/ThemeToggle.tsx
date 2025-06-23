"use client";
import { useContext, useEffect } from "react";
import "./ThemeToggle.css";

// Importa el contexto de tema global
import { ThemeContext } from "@/context/AppContexts";

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("transitioning-theme");
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
      <span className="theme-toggle-icon" aria-hidden="true">
        {/* Sol siempre visible, eclipse con la luna */}
        <span className="theme-toggle-sun">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14" cy="14" r="8" fill="#FFD600" />
            {/* Rayos */}
            {[...Array(8)].map((_, i) => (
              <rect
                key={i}
                x="13"
                y="2"
                width="2"
                height="5"
                rx="1"
                fill="#FFD600"
                transform={`rotate(${i * 45} 14 14)`}
              />
            ))}
          </svg>
        </span>
        <span
          className="theme-toggle-moon-eclipse"
          style={{
            opacity: 1,
            transform: darkMode ? "translateX(0) scale(1)" : "translateX(18px) scale(0.7)",
            transition: "transform 0.32s cubic-bezier(.77,0,.18,1.01)",
            zIndex: 2,
          }}
        >
          {/* Luna minimalista */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="14" cy="14" r="8" fill="#E0E3F4" />
            <circle cx="17" cy="12" r="2" fill="#C1C4D6" />
            <circle cx="12" cy="18" r="1.2" fill="#C1C4D6" />
          </svg>
        </span>
      </span>
    </button>
  );
}