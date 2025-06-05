export default function EventosSection() {
  return (
    <section className="w-full max-w-4xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center min-h-[220px]">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Galería de Eventos
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
        <img
          src="/RadioEclipse2.0.webp"
          alt="Evento 1"
          className="rounded-lg object-cover w-full h-32"
        />
        <img
          src="/NuestraManana2.0.webp"
          alt="Evento 2"
          className="rounded-lg object-cover w-full h-32"
        />
        <img
          src="/RadioEclipse2.0.webp"
          alt="Evento 3"
          className="rounded-lg object-cover w-full h-32"
        />
        <img
          src="/NuestraManana2.0.webp"
          alt="Evento 4"
          className="rounded-lg object-cover w-full h-32"
        />
      </div>
    </section>
  );
}
