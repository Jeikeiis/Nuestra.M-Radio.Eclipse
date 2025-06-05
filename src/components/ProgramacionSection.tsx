export default function ProgramacionSection() {
  return (
    <section className="w-full max-w-xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center mt-8 min-h-[220px]">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Programación
      </h3>
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">🎙️</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Noticias</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">ℹ️</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Información</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">🌟</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Farándula</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">🎉</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Entretenimiento</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">🎵</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Música</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2">
          <span className="text-orange-500 text-lg">🔮</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Horóscopo</span>
        </div>
        <div className="flex items-center gap-2 bg-[rgba(71,1,0,0.85)] dark:bg-[rgba(71,1,0,0.65)] rounded-lg px-4 py-2 col-span-2">
          <span className="text-orange-500 text-lg">🗣️</span>
          <span className="text-gray-100 dark:text-gray-200 font-medium">Entrevistas</span>
        </div>
      </div>
    </section>
  );
}
