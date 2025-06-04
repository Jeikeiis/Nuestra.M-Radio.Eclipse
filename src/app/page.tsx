import Image from "next/image";
import ThemeToggle from "../components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-black to-gray-900 text-white dark:bg-gradient-to-br dark:from-gray-100 dark:via-white dark:to-blue-200 dark:text-gray-900 transition-colors">
      {/* Encabezado */}
      <header className="flex flex-col items-center py-10 bg-black/60 dark:bg-white/80 shadow-lg transition-colors">
        <Image
          src="/NuestraMañana2.0.png"
          alt="Logo Nuestra.M-Radio.Eclipse"
          width={140}
          height={140}
          className="mb-4 rounded-lg"
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-blue-300 dark:text-blue-800 text-center">
          Nuestra.M-Radio.Eclipse
        </h1>
        <p className="text-lg text-gray-300 dark:text-gray-700 text-center max-w-xl">
          La mejor música, en vivo y online. ¡Conéctate, escucha y comparte!
        </p>
        <ThemeToggle />
      </header>

      {/* Sección principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        {/* ...contenido principal... */}
      </main>

      {/* Pie de página */}
      <footer className="py-6 px-4 flex flex-col sm:flex-row justify-between items-center text-gray-400 dark:text-gray-700 bg-black/70 dark:bg-white/70 transition-colors">
        <span>
          © {new Date().getFullYear()} Nuestra.M-Radio.Eclipse — Hecho con Next.js
        </span>
        <span className="mt-4 sm:mt-0 sm:ml-4 flex items-center gap-4 font-semibold text-orange-300 dark:text-orange-600">
          <Image
            src="/RadioEclipse2.0.png"
            alt="Radio Eclipse 106.3"
            width={140}
            height={140}
            className="rounded"
            priority={false}
          />
          Radio Eclipse 106.3 · Canelones, Uruguay
        </span>
      </footer>
    </div>
  );
}