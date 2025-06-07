import { useRef, useState, useEffect } from "react";

export default function RadioDashboard({
  playing,
  setPlaying,
  volume,
  setVolume,
  error,
  setError,
  onClose,
  onSyncLive,
  audioRef
}: {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  error: boolean;
  setError: (v: boolean) => void;
  onClose?: () => void;
  onSyncLive: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}) {
  // El panel solo controla la UI, no el audio
  return (
    <>
      {/* El audio ya está en layout.tsx, aquí solo controles visuales */}
      <section
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md rounded-t-2xl flex flex-col items-center shadow-2xl border border-white/10 animate-fade-in-up backdrop-blur-md bg-opacity-80"
        style={{
          minWidth: 0,
          WebkitOverflowScrolling: 'touch',
          background: "rgba(20,20,20,0.92)", // Fondo oscuro semitransparente
        }}
        aria-label="Radio en vivo Nuestra Mañana FM 106.3"
      >
        <div className="flex items-center justify-between w-full px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <img
              src="/NuestraManana2.0.webp"
              alt="Logo Nuestra Mañana FM 106.3"
              width={44}
              height={44}
              className="rounded-lg shadow border border-white/30 bg-black object-cover"
              style={{ background: "#000" }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-white leading-tight truncate">
                Nuestra Mañana FM 106.3
              </span>
              <span className="text-xs text-gray-200 truncate">En vivo · Lunes a Viernes de 10 a 13 hs</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (onClose) onClose();
            }}
            className="ml-2 text-white text-2xl hover:text-red-500 px-2"
            aria-label="Minimizar reproductor"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 16V8m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div className="w-full px-4 pb-4 flex flex-col items-center">
          <div className="flex items-center gap-2 w-full justify-center mt-2">
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (audioRef.current.paused) {
                  audioRef.current.play();
                } else {
                  audioRef.current.pause();
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-base shadow-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black text-white hover:bg-gray-800 border border-white/40"
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? (
                <svg width="22" height="22" fill="white" viewBox="0 0 20 20"><rect x="4" y="4" width="4" height="12"/><rect x="12" y="4" width="4" height="12"/></svg>
              ) : (
                <svg width="22" height="22" fill="white" viewBox="0 0 20 20"><polygon points="5,4 15,10 5,16"/></svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => {
                const v = Number(e.target.value);
                setVolume(v);
                if (audioRef.current) audioRef.current.volume = v;
              }}
              className="w-20 accent-red-600 mx-1"
              aria-label="Volumen"
            />
            <button
              onClick={onSyncLive}
              className="flex items-center gap-1 px-2 h-8 rounded-full bg-white border border-red-500 ml-1 shadow hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Sincronizar con el vivo"
              title="Sincronizar con el vivo"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-600 leading-none">Vivo</span>
            </button>
          </div>
          {error && (
            <span className="text-xs text-red-400 ml-2 mt-2">Error de señal</span>
          )}
        </div>
      </section>
    </>
  );
}