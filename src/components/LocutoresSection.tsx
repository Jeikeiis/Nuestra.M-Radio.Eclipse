import "./LocutoresSection.css";

export default function LocutoresSection() {
  return (
    <section className="locutores-section">
      <h3 className="locutores-title">Locutores</h3>
      <div className="flex justify-center w-full">
        <div className="locutores-profile">
          <img
            src="/NuestraManana2.0.webp"
            alt="Nuestra Mañana - Radio Eclipse"
            width={140}
            height={140}
            className="locutores-img locutores-img-lg"
          />
          <span className="locutores-name locutores-name-lg">
            Federico Pinato
          </span>
          <span className="locutores-desc locutores-desc-lg">
            Nuestra Mañana
          </span>
        </div>
      </div>
    </section>
  );
}
