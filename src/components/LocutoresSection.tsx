import "./LocutoresSection.css";

const locutores = [
  {
    nombre: "Fede Pinato",
    programa: "Nuestra Mañana",
    img: "/FedePerfil.webp", // Actualizado para mostrar la nueva foto
    alt: "Fede Pinato - Nuestra Mañana",
  },
];

export default function LocutoresSection() {
  return (
    <section className="locutores-section main-section" id="locutores">
      <h3 className="locutores-title">Nuestro Locutor</h3>
      <p className="locutores-desc-main">
        De lunes a viernes, de 10 a 13 horas, Federico te acompaña en{" "}
        <b>Nuestra Mañana</b> por Radio Eclipse FM 106.3. Un programa pensado
        para comenzar el día con la mejor energía, información actualizada, buena
        música y la calidez de un conductor cercano a su audiencia.
      </p>
      <div className="locutores-grid">
        {locutores.map((l) => (
          <div className="locutores-profile" key={l.nombre}>
            <a
              href="https://www.instagram.com/federico.pinato.9/"
              target="_blank"
              rel="noopener noreferrer external nofollow"
              referrerPolicy="no-referrer"
            >
              <img src={l.img} alt={l.alt} className="locutores-img" />
            </a>
            <span className="locutores-name">{l.nombre}</span>
            <span className="locutores-programa">{l.programa}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
