export default function LocutoresSection() {
  return (
    <section className="w-full max-w-3xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center min-h-[320px]">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Locutores
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
        <div className="flex flex-col items-center min-w-0">
          <img
            src="/RadioEclipse2.0.png"
            alt="Locutor 1"
            className="w-24 h-24 rounded-full mb-2 border-4 border-orange-400 object-cover"
          />
          <span className="font-bold text-gray-900 dark:text-white truncate w-full text-center">
            Ana Torres
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
            Mañanas en Eclipse
          </span>
        </div>
        <div className="flex flex-col items-center min-w-0">
          <img
            src="/NuestraManana2.0.webp"
            alt="Nuestra Mañana - Radio Eclipse"
            width={96}
            height={96}
            className="rounded-lg object-cover w-24 h-24 mb-2 border-4 border-orange-400"
          />
          <span className="font-bold text-gray-900 dark:text-white truncate w-full text-center">
            Federico Pinato
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
            Nuestra Mañana
          </span>
        </div>
        <div className="flex flex-col items-center min-w-0">
          <img
            src="/RadioEclipse2.0.png"
            alt="Locutor 3"
            className="w-24 h-24 rounded-full mb-2 border-4 border-orange-400 object-cover"
          />
          <span className="font-bold text-gray-900 dark:text-white truncate w-full text-center">
            Lucía Gómez
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full text-center">
            Noches de Eclipse
          </span>
        </div>
      </div>
    </section>
  );
}
