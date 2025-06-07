import "./ProgramacionSection.css";

export default function ProgramacionSection() {
  return (
    <section className="programacion-section">
      <h3 className="programacion-title">Programación</h3>
      <div className="programacion-grid">
        <div className="programacion-item">
          <span className="programacion-emoji">🎙️</span>
          <span className="programacion-text">Noticias</span>
        </div>
        <div className="programacion-item">
          <span className="programacion-emoji">ℹ️</span>
          <span className="programacion-text">Información</span>
        </div>
        <div className="programacion-item">
          <span className="programacion-emoji">🌟</span>
          <span className="programacion-text">Farándula</span>
        </div>
        <div className="programacion-item">
          <span className="programacion-emoji">🎉</span>
          <span className="programacion-text">Entretenimiento</span>
        </div>
        <div className="programacion-item">
          <span className="programacion-emoji">🎵</span>
          <span className="programacion-text">Música</span>
        </div>
        <div className="programacion-item">
          <span className="programacion-emoji">🔮</span>
          <span className="programacion-text">Horóscopo</span>
        </div>
        <div className="programacion-item col-span-2">
          <span className="programacion-emoji">🗣️</span>
          <span className="programacion-text">Entrevistas</span>
        </div>
      </div>
    </section>
  );
}
