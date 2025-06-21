import React, { useState } from "react";
import "./ProgramacionSection.css";
import ApiProgramSection from "./ApiProgramSection";
import Modal from "./Modal";

const PROGRAMAS = [
  {
    key: "noticias",
    icon: "📰",
    titulo: "Noticias",
    contenido: <ApiProgramSection
      apiPath="/api/noticias"
      cacheKey="noticiasCacheLocal"
      sectionClass="programacion-noticias-section"
      updatedMsg="¡Noticias actualizadas!"
      emptyMsg="No se encontraron noticias relevantes."
      adminKey="adminNoticias"
    />,
  },
  {
    key: "informacion",
    icon: "ℹ️",
    titulo: "Información",
    contenido: <div style={{ padding: 16 }}>Sin datos disponibles.</div>,
  },
  {
    key: "farandula",
    icon: "🎤",
    titulo: "Farándula",
    contenido: <ApiProgramSection
      apiPath="/api/farandula"
      cacheKey="farandulaCacheLocal"
      sectionClass="programacion-farandula-section"
      updatedMsg="¡Farándula actualizada!"
      emptyMsg="No se encontraron noticias de farándula relevantes."
      adminKey="adminNoticias"
    />,
  },
  {
    key: "entretenimiento",
    icon: "🎬",
    titulo: "Entretenimiento",
    contenido: <div style={{ padding: 16 }}>Sin datos disponibles.</div>,
  },
  {
    key: "musica",
    icon: "🎵",
    titulo: "Música",
    contenido: <ApiProgramSection
      apiPath="/api/musica"
      cacheKey="musicaCacheLocal"
      sectionClass="programacion-musica-section"
      updatedMsg="¡Música actualizada!"
      emptyMsg="No se encontraron noticias de música relevantes."
      adminKey="adminNoticias"
    />,
  },
  {
    key: "horoscopo",
    icon: "🔮",
    titulo: "Horóscopo",
    contenido: <div style={{ padding: 16 }}>Sin datos disponibles.</div>,
  },
  {
    key: "entrevistas",
    icon: "👤",
    titulo: "Entrevistas",
    contenido: <div style={{ padding: 16 }}>Sin datos disponibles.</div>,
  },
  // ...agrega más si tienes otras secciones...
];

export default function ProgramacionSection() {
  const [modal, setModal] = useState<string | null>(null);

  return (
    <section className="programacion-section" id="programacion">
      <h2 className="programacion-title">Programación</h2>
      <ul className="programacion-list">
        {PROGRAMAS.map((prog) => {
          const esInteractivo = ["noticias", "musica", "farandula"].includes(prog.key);
          return (
            <li
              key={prog.key}
              className={`programacion-item${esInteractivo ? '' : ' programacion-item-disabled'}`}
              onClick={esInteractivo ? () => setModal(prog.key) : undefined}
              tabIndex={esInteractivo ? 0 : -1}
              style={{ cursor: esInteractivo ? "pointer" : "not-allowed", opacity: esInteractivo ? 1 : 0.5 }}
              aria-label={esInteractivo ? `Abrir ${prog.titulo}` : `${prog.titulo} (no disponible)`}
            >
              <span className="programacion-emoji">{prog.icon}</span>
              <span className="programacion-text">{prog.titulo}</span>
            </li>
          );
        })}
      </ul>
      {/* Modal profesional reutilizable para secciones configuradas */}
      {PROGRAMAS.filter((prog) => ["noticias", "musica", "farandula"].includes(prog.key)).map(
        (prog) => (
          <Modal
            key={prog.key}
            open={modal === prog.key}
            onClose={() => setModal(null)}
            title={prog.titulo}
            icon={prog.icon}
            ariaLabel={`Modal de ${prog.titulo}`}
            maxWidth={typeof window !== "undefined" && window.innerWidth <= 640 ? "99vw" : "1200px"}
            minWidth={typeof window !== "undefined" && window.innerWidth <= 640 ? undefined : "600px"}
          >
            {prog.contenido}
          </Modal>
        )
      )}
    </section>
  );
}


