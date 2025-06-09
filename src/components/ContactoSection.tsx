import "./ContactoSection.css";

export default function ContactoSection() {
  return (
    <section className="contacto-section">
      <h3 className="contacto-title">Contacto</h3>
      <form className="contacto-form">
        <input
          type="text"
          placeholder="Nombre"
          className="contacto-input"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          className="contacto-input"
        />
        <textarea
          placeholder="Mensaje"
          className="contacto-textarea"
          rows={3}
        ></textarea>
        <button
          type="submit"
          className="contacto-btn"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
