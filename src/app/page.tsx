"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col transition-colors">
      {/* Encabezado */}
      <AppHeader />

      {/* Sección principal */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-36 pb-10">
        {/* Menú de información */}
        <section className="w-full max-w-xl bg-white/80 dark:bg-black/60 rounded-2xl shadow-lg p-8 flex flex-col items-center">
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
            {/* Agrega más opciones aquí */}
          </ul>
        </section>
      </main>

      {/* Pie de página */}
      <AppFooter />
    </div>
  );
}