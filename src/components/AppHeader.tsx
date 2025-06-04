import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import RadioDashboard from "./RadioDashboard";
import { forwardRef } from "react";

const AppHeader = forwardRef<HTMLElement>((props, ref) => {
  return (
    <header
      ref={ref as any}
      className="fixed top-0 left-0 w-full z-50 bg-white/90 dark:bg-black/90 backdrop-blur shadow-lg transition-colors"
      style={{ minHeight: 80 }}
    >
      {/*
        Layout responsive horizontal:
        - En pantallas sm o mayores: todos los elementos en fila (logo/info, reproductor, toggle)
        - En móvil: logo/info arriba, reproductor y toggle abajo
      */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2 sm:px-6 py-2 sm:py-3">
        {/* Logo e info */}
        <div className="flex flex-row items-center gap-3 min-w-0 flex-1 justify-center sm:justify-start">
          <Image
            src="/NuestraMañana2.0.png"
            alt="Logo Nuestra.M-Radio.Eclipse"
            width={120}
            height={120}
            className="rounded-lg flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40"
            priority
          />
          <div className="min-w-0 ml-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
              Radio Eclipse FM 106.3
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 truncate">
              La mejor música, en vivo y online.
            </p>
          </div>
        </div>
        {/* Reproductor y toggle en horizontal en sm+ */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:justify-end mt-2 sm:mt-0">
          <div className="flex-1 flex justify-center w-full sm:w-auto min-w-0">
            <RadioDashboard />
          </div>
          <div className="flex-shrink-0 ml-0 sm:ml-4 mt-2 sm:mt-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
});

export default AppHeader;