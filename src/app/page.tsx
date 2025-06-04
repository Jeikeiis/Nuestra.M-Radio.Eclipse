"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { useRef, useLayoutEffect, useState } from "react";
// Desactivado temporalmente por falta de soporte en el backend
// import WebScrapingSection from "../components/WebScrapingSection";

export default function Home() {
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors pt-20"
      style={{ paddingTop: headerHeight }}
    >
      {/* Encabezado */}
      <AppHeader ref={headerRef} />

      {/* Sección principal */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-10 gap-12">
        {/* Menú de información */}
        <section className="w-full max-w-xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Programación
          </h3>
          <ul className="text-gray-700 dark:text-gray-200 text-base space-y-2">
            <li>· Noticias</li>
            <li>· Información</li>
            <li>· Farándula</li>
            <li>· Entretenimiento</li>
            <li>· Música</li>
            <li>· Horóscopo</li>
            <li>· Entrevistas</li>
          </ul>
        </section>

        {/* Sección de locutores */}
        <section className="w-full max-w-3xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Locutores
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            <div className="flex flex-col items-center">
              <img
                src="/RadioEclipse2.0.png"
                alt="Locutor 1"
                className="w-20 h-20 rounded-full mb-2 border-4 border-orange-400"
              />
              <span className="font-bold text-gray-900 dark:text-white">
                Ana Torres
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Mañanas en Eclipse
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="/NuestraMañana2.0.png"
                alt="Locutor 2"
                className="w-20 h-20 rounded-full mb-2 border-4 border-orange-400"
              />
              <span className="font-bold text-gray-900 dark:text-white">
                Federico Pinato
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Nuestra Mañana
              </span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="/RadioEclipse2.0.png"
                alt="Locutor 3"
                className="w-20 h-20 rounded-full mb-2 border-4 border-orange-400"
              />
              <span className="font-bold text-gray-900 dark:text-white">
                Lucía Gómez
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Noches de Eclipse
              </span>
            </div>
          </div>
        </section>

        {/* Sección de podcasts */}
        <section className="w-full max-w-3xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Podcasts Recientes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 flex flex-col items-center">
              <span className="font-bold text-gray-900 dark:text-white mb-2">
                Entrevista a Bandas Locales
              </span>
              <audio controls className="w-full">
                <source src="#" type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 flex flex-col items-center">
              <span className="font-bold text-gray-900 dark:text-white mb-2">
                Especial de Rock Nacional
              </span>
              <audio controls className="w-full">
                <source src="#" type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-4 flex flex-col items-center">
              <span className="font-bold text-gray-900 dark:text-white mb-2">
                Noticias de la Semana
              </span>
              <audio controls className="w-full">
                <source src="#" type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          </div>
        </section>

        {/* Sección de galería de eventos */}
        <section className="w-full max-w-4xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center">
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
              src="/NuestraMañana2.0.webp"
              alt="Evento 2"
              className="rounded-lg object-cover w-full h-32"
            />
            <img
              src="/RadioEclipse2.0.webp"
              alt="Evento 3"
              className="rounded-lg object-cover w-full h-32"
            />
            <img
              src="/NuestraMañana2.0.webp"
              alt="Evento 4"
              className="rounded-lg object-cover w-full h-32"
            />
          </div>
        </section>

        {/* Sección de eventos scrapeados de la comuna canaria */}
        {/* <WebScrapingSection /> */}

        {/* Sección de contacto */}
        <section className="w-full max-w-xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Contacto
          </h3>
          <form className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre"
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <textarea
              placeholder="Mensaje"
              className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              rows={3}
            ></textarea>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded transition-colors"
            >
              Enviar
            </button>
          </form>
        </section>
      </main>

      {/* Pie de página */}
      <AppFooter />
    </div>
  );
}