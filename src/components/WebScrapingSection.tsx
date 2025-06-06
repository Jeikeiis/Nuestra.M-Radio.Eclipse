"use client";
import { useEffect, useState } from "react";

export default function WebScrapingSection() {
  const [eventos, setEventos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchEventos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scrape");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEventos(data.eventos);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventos();
    let interval = setInterval(fetchEventos, 7 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full max-w-2xl bg-white dark:bg-black rounded-2xl shadow-lg p-8 flex flex-col items-center mt-8">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Próximos eventos de la Comuna Canaria
      </h3>
      {loading && <div className="text-gray-500">Cargando...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {!loading && !error && (
        <ul className="w-full list-disc pl-6 text-gray-800 dark:text-gray-100 text-base">
          {eventos.length === 0 && <li>No hay eventos disponibles.</li>}
          {eventos.map((evento, i) => (
            <li key={i}>{evento}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
