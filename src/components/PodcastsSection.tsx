export default function PodcastsSection() {
  return (
    <section className="w-full max-w-3xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center min-h-[260px]">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Podcasts Recientes
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full">
        <div className="bg-[#fffdf8] dark:bg-[#18181b] rounded-2xl p-4 flex flex-col items-center min-h-[120px] w-full">
          <span className="font-bold text-[#1a1a1a] dark:text-white mb-2 text-center truncate w-full">
            Entrevista a Bandas Locales
          </span>
          <audio controls className="w-full">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
        <div className="bg-[#fffdf8] dark:bg-[#18181b] rounded-2xl p-4 flex flex-col items-center min-h-[120px] w-full">
          <span className="font-bold text-[#1a1a1a] dark:text-white mb-2 text-center truncate w-full">
            Especial de Rock Nacional
          </span>
          <audio controls className="w-full">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
        <div className="bg-[#fffdf8] dark:bg-[#18181b] rounded-2xl p-4 flex flex-col items-center min-h-[120px] w-full">
          <span className="font-bold text-[#1a1a1a] dark:text-white mb-2 text-center truncate w-full">
            Noticias de la Semana
          </span>
          <audio controls className="w-full">
            <source src="#" type="audio/mpeg" />
            Tu navegador no soporta el elemento de audio.
          </audio>
        </div>
      </div>
    </section>
  );
}
