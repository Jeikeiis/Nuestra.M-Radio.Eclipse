import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import RadioDashboard from "./RadioDashboard";

export default function AppHeader() {
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-black/90 backdrop-blur shadow-lg transition-colors"
      style={{ minHeight: 80 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-2 px-2 sm:px-6 py-2 sm:py-3
                      sm:flex-row sm:items-center sm:justify-between">
        {/* Logo e info */}
        <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
          <Image
            src="/NuestraMañana2.0.png"
            alt="Logo Nuestra.M-Radio.Eclipse"
            width={96}
            height={96}
            className="rounded-lg flex-shrink-0 w-16 h-16 sm:w-24 sm:h-24"
            priority
          />
          <div className="min-w-0 ml-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
              Nuestra.M-Radio.Eclipse
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 truncate">
              La mejor música, en vivo y online.
            </p>
          </div>
        </div>
        {/* Reproductor */}
        <div className="flex-1 flex justify-center w-full sm:w-auto my-2 sm:my-0 min-w-0">
          <RadioDashboard />
        </div>
        {/* Tema */}
        <div className="flex-shrink-0 ml-0 sm:ml-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}