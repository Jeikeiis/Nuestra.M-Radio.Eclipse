import "./LocutoresSection.css";

export default function LocutoresSection() {
  return (
    <section className="locutores-section">
      <h3 className="locutores-title">Nuestro Equipo de Locutores</h3>
      <p className="locutores-desc-main">
        De lunes a viernes, de 10 a 13 horas, Federico te acompaña en <b>Nuestra Mañana</b> por
        Radio Eclipse FM 106.3. Un programa pensado para comenzar el día con
        la mejor energía, información actualizada, buena música y la calidez
        de un conductor cercano a su audiencia.
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
