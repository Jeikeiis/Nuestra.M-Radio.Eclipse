import Image from "next/image";
import { useRef, useState } from "react";

export default function RadioDashboard() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);
  const streamUrl = "https://stream.zeno.fm/we6d4vg2198uv";
  const coverUrl = "https://stream-tools.zenomedia.com/content/stations/agxzfnplbm8tc3RhdHNyMgsSCkF1dGhDbGllbnQYgICQmpfPhgkMCxIOU3RhdGlvblByb2ZpbGUYgIDwyvXcpAoMogEEemVubw/image/?keep=w&lu=1661505950000&resize=350x350";
  const bgStyle = {
    background: "linear-gradient(90deg, #ff7300 0%, #1e293b 100%)",
    boxShadow: "0 0 24px 0 rgba(255,115,0,0.2), 0 0 24px 0 rgba(30,41,59,0.2)",
    backdropFilter: "blur(2px)",
  };

  // Sincronizar con el vivo: recarga el stream y reproduce
  const handleSyncLive = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  return (
    <section
      className="w-auto max-w-xs rounded-full flex flex-row items-center gap-2 px-3 py-2"
      style={bgStyle}
      aria-label="Radio en vivo Eclipse FM"
    >
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="auto"
        style={{ display: "none" }}
        onPlay={() => { setPlaying(true); setError(false); }}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
        autoPlay={false}
        controls={false}
        crossOrigin="anonymous"
      />
      <a href="https://zeno.fm/eclipsefm1063" target="_blank" rel="noopener noreferrer" tabIndex={-1}>
        <Image
          src={coverUrl}
          alt="ECLIPSE FM"
          width={40}
          height={40}
          className="w-10 h-10 rounded-lg shadow-lg border border-white"
        />
      </a>
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-xs font-bold text-white leading-tight truncate">
          ECLIPSE FM
        </span>
        <span className="text-[10px] text-gray-200 truncate">106.3 · Uruguay</span>
      </div>
      <button
        onClick={() => {
          if (!audioRef.current) return;
          if (audioRef.current.paused) {
            audioRef.current.play();
          } else {
            audioRef.current.pause();
          }
        }}
        className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-base shadow-lg hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label={playing ? "Pausar" : "Reproducir"}
      >
        {playing ? (
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><rect x="4" y="4" width="4" height="12"/><rect x="12" y="4" width="4" height="12"/></svg>
        ) : (
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><polygon points="5,4 15,10 5,16"/></svg>
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
        className="w-16 accent-blue-600 mx-1"
        aria-label="Volumen"
      />
      <button
        onClick={handleSyncLive}
        className="flex items-center gap-1 px-2 h-7 rounded-full bg-white border border-red-500 ml-1 shadow hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="Sincronizar con el vivo"
        title="Sincronizar con el vivo"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span className="text-xs font-bold text-red-600 leading-none">Vivo</span>
      </button>
      {error && (
        <span className="text-xs text-red-400 ml-2">Error de señal</span>
      )}
    </section>
  );
}