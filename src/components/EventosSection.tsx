import "./EventosSection.css";

export default function EventosSection() {
  return (
    <section className="eventos-section main-section">
      <h3 className="eventos-title">
        Galería de Eventos
      </h3>
      {/* Si necesitas una descripción, descomenta la siguiente línea */}
      {/* <div className="eventos-desc-main">Descripción de la galería de eventos.</div> */}
      <div className="eventos-grid">
        <img
          src="/RadioEclipse2.0.webp"
          alt="Evento 1"
          className="evento-img"
        />
        <img
          src="/NuestraManana2.0.webp"
          alt="Evento 2"
          className="evento-img"
        />
        <img
          src="/RadioEclipse2.0.webp"
          alt="Evento 3"
          className="evento-img"
        />
        <img
          src="/NuestraManana2.0.webp"
          alt="Evento 4"
          className="evento-img"
        />
      </div>
    </section>
  );
}
