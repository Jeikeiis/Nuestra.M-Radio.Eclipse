"use client";
import { useContext, useEffect, useRef } from "react";
import "./ThemeToggle.css";

// Importa el contexto de tema global
import { ThemeContext } from "@/context/AppContexts";

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  // Animación de placa metálica al hacer click
  function handleClick() {
    setDarkMode(!darkMode);
    // Busca el contenedor de acciones y dispara el efecto
    const actions = document.querySelector('.app-header-actions');
    if (actions) {
      actions.classList.add('metal-animate');
      setTimeout(() => {
        actions.classList.remove('metal-animate');
      }, 700); // Duración de la animación
    }
    // Quita el focus del botón
    if (btnRef.current) btnRef.current.blur();
  }

  return (
    <button
      ref={btnRef}
      className={`theme-toggle-btn`}
      onClick={handleClick}
      aria-label="Cambiar modo claro/oscuro"
      // Animación de escala y sombra al hacer clic
      style={{
        transition:
          "box-shadow 0.32s cubic-bezier(.68,-0.55,.27,1.55), transform 0.32s cubic-bezier(.68,-0.55,.27,1.55)",
        boxShadow: darkMode
          ? "0 0 16px 2px #FFD60055"
          : "0 0 12px 1px #e5393555",
        transform: darkMode
          ? "scale(1.08) rotate(-10deg)"
          : "scale(1.08) rotate(10deg)",
      }}
    >
      <span
        className="theme-toggle-icon"
        aria-hidden="true"
        // Animación de rebote al cambiar
        style={{
          transition: "transform 0.38s cubic-bezier(.68,-0.55,.27,1.55)",
          transform: darkMode
            ? "scale(1.12) rotate(-15deg)"
            : "scale(1.12) rotate(15deg)",
        }}
      >
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
            transform: darkMode
              ? "translateX(0) scale(1.08) rotate(-8deg)"
              : "translateX(18px) scale(0.7) rotate(12deg)",
            transition: "transform 0.42s cubic-bezier(.77,0,.18,1.01)",
            zIndex: 2,
            filter: darkMode
              ? "drop-shadow(0 0 8px #FFD60088)"
              : "drop-shadow(0 0 4px #e5393588)",
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