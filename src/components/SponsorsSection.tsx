import "./SponsorsSection.css";

export default function SponsorsSection() {
  return (
    <section className="sponsors-section">
      <h4>Sponsors</h4>
      <div className="sponsors-list">
        {/* Ejemplo de sponsor, puedes duplicar o mapear según tus necesidades */}
        <a href="#" target="_blank" rel="noopener noreferrer" className="sponsor-item">
          <img src="/SanitariaNunez.webp" alt="Sanitaria Nuñez" />
          <span>Sanitaria Nuñez</span>
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="sponsor-item">
          <img src="/globe.svg" alt="Sponsor 2" />
          <span>Empresa 2</span>
        </a>
        {/* Agrega más sponsors aquí */}
      </div>
    </section>
  );
}
