import Image from "next/image";

export default function AppFooter() {
  return (
    <footer
      className={`
        w-full mt-auto px-6 sm:px-16 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t
        border-gray-200 dark:border-gray-700 transition-colors
        bg-gradient-to-r from-white via-orange-200 to-orange-500
        dark:from-[#1e293b] dark:via-[#23272f] dark:to-[#ff7300]/20
      `}
    >
      <div className="flex items-center gap-4">
        <Image
          src="/RadioEclipse2.0.png"
          alt="Radio Eclipse 106.3"
          width={90}
          height={90}
          className="rounded shadow-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#23272f]"
          priority={false}
        />
        <div className="flex flex-col">
          <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white drop-shadow-sm">
            Radio Eclipse 106.3
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Canelones, Uruguay
          </span>
        </div>
      </div>
      <div className="text-center sm:text-right flex flex-col items-center sm:items-end px-6 py-3 rounded-lg bg-white/70 dark:bg-[#23272f]/70 shadow">
        <span className="text-sm text-black dark:text-white font-medium">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://nuestramananaradioeclipse-git-main-jeikeiis-projects.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-orange-500 transition-colors"
          >
            Radio Eclipse FM 106.3
          </a>
        </span>
        <span className="text-xs text-gray-600 dark:text-blue-300 mt-1">
          Hecho por Jeikeiis con{" "}
          <span className="text-orange-500 font-bold">♥</span> y Next.js
        </span>
      </div>
    </footer>
  );
}