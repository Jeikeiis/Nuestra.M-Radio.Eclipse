import "./ContactoSection.css";

export default function ContactoSection() {
  return (
    <section className="w-full max-w-xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center mb-8 min-h-[220px]">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Contacto
      </h3>
      <form className="w-full flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nombre"
          className="px-4 py-2 rounded contacto-input"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          className="px-4 py-2 rounded contacto-input"
        />
        <textarea
          placeholder="Mensaje"
          className="px-4 py-2 rounded contacto-textarea"
          rows={3}
        ></textarea>
        <button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
          style={{
            background:
              "linear-gradient(90deg,rgb(255, 94, 0) 0%,rgb(255, 43, 15) 100%)",
          }}
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
