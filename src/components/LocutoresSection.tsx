import "./LocutoresSection.css";

export default function LocutoresSection() {
  return (
    <section className="locutores-section">
      <h3 className="locutores-title">Nuestro Equipo de Locutores</h3>
      <p className="locutores-desc-main">
        Conocé a las voces que acompañan cada día en Radio Eclipse. Profesionales
        apasionados, cercanos y con gran trayectoria, listos para brindarte la
        mejor compañía y la mejor música.
      </p>
      <div className="locutores-grid">
        <div className="locutores-profile">
          <img
            src="/NuestraManana2.0.webp"
            alt="Federico Pinato - Nuestra Mañana"
            className="locutores-img"
          />
          <span className="locutores-name">Federico Pinato</span>
          <span className="locutores-programa">Nuestra Mañana</span>
        </div>
      </div>
    </section>
  );
}
