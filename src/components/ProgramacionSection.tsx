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
    />, // visible pero no interactivo
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
    />, // visible pero no interactivo
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
    />, // visible pero no interactivo
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
          // Todas las secciones desactivadas para noticias, musica y farandula
          const esInteractivo = false;
          return (
            <li
              key={prog.key}
              className={`programacion-item programacion-item-disabled`}
              tabIndex={-1}
              style={{ cursor: "not-allowed", opacity: 0.5 }}
              aria-label={`${prog.titulo} (no disponible)`}
            >
              <span className="programacion-emoji">{prog.icon}</span>
              <span className="programacion-text">{prog.titulo}</span>
            </li>
          );
        })}
      </ul>
      {/* Modal profesional reutilizable para secciones configuradas */}
      {/* No mostrar modales para ninguna sección desactivada */}
    </section>
  );
}


