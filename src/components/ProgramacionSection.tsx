import React, { useState } from "react";
import "./ProgramacionSection.css";
import ProgramacionNoticiasSection from "./ProgramacionNoticiasSection";
import ProgramacionMusicaSection from "./ProgramacionMusicaSection";
import ProgramacionFarandulaSection from "./ProgramacionFarandulaSection";

const PROGRAMAS = [
  {
    key: "noticias",
    icon: "📰",
    titulo: "Noticias",
    contenido: <ProgramacionNoticiasSection />,
  },
  {
    key: "musica",
    icon: "🎵",
    titulo: "Música",
    contenido: <ProgramacionMusicaSection />,
  },
  {
    key: "farandula",
    icon: "🎤",
    titulo: "Farándula",
    contenido: <ProgramacionFarandulaSection />,
  },
  // ...agrega más si tienes otras secciones...
];

export default function ProgramacionSection() {
  const [modal, setModal] = useState<string | null>(null);

  return (
    <section className="programacion-section" id="programacion">
      <h2 className="programacion-title">Programación</h2>
      <ul className="programacion-list">
        {PROGRAMAS.map((prog) => (
          <li
            key={prog.key}
            className="programacion-item"
            onClick={() => setModal(prog.key)}
            tabIndex={0}
            style={{ cursor: "pointer" }}
            aria-label={`Abrir ${prog.titulo}`}
          >
            <span className="programacion-emoji">{prog.icon}</span>
            <span className="programacion-text">{prog.titulo}</span>
          </li>
        ))}
      </ul>
      {/* Ventana flotante/modal */}
      {PROGRAMAS.map(
        (prog) =>
          modal === prog.key && (
            <div
              key={prog.key}
              className="programacion-modal"
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 2000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflowY: "auto",
                padding: 0,
              }}
              onClick={() => setModal(null)}
            >
              <div
                className="programacion-modal-content"
                style={{
                  background: "var(--program-item-bg, #fff)",
                  borderRadius: "1rem",
                  // Cambia aquí: más ancho y alto en escritorio
                  width:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? "99vw"
                      : "90vw",
                  maxWidth:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? "99vw"
                      : "1200px",
                  minWidth:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? undefined
                      : "600px",
                  height:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? "auto"
                      : "90vh",
                  maxHeight:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? "98vh"
                      : "90vh",
                  overflowY: "auto",
                  boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
                  position: "relative",
                  padding:
                    typeof window !== "undefined" && window.innerWidth <= 640
                      ? "1.1rem 0.3rem 0.7rem 0.3rem"
                      : "2rem 2.5rem 2rem 2.5rem",
                  border: "none",
                  // ...otros estilos si necesitas...
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setModal(null)}
                  aria-label="Cerrar"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "#b71c1c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    fontSize: 22,
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                >
                  ×
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{prog.icon}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "1.3rem",
                    }}
                  >
                    {prog.titulo}
                  </span>
                </div>
                <div>{prog.contenido}</div>
              </div>
            </div>
          )
      )}
    </section>
  );
}


