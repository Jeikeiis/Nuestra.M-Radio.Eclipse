import { useRef, useState } from "react";

export default function RadioDashboard() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const streamUrl = "https://stream.zeno.fm/we6d4vg2198uv";
  const coverUrl = "https://stream-tools.zenomedia.com/content/stations/agxzfnplbm8tc3RhdHNyMgsSCkF1dGhDbGllbnQYgICQmpfPhgkMCxIOU3RhdGlvblByb2ZpbGUYgIDwyvXcpAoMogEEemVubw/image/?keep=w&lu=1661505950000&resize=350x350";
  const bgUrl = "https://stream-tools.zenomedia.com/content/stations/agxzfnplbm8tc3RhdHNyMgsSCkF1dGhDbGllbnQYgICQmpfPhgkMCxIOU3RhdGlvblByb2ZpbGUYgIDwyvXcpAoMogEEemVubw/microsite/background_image/?keep=w&updated=1661505950000";

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div
      className="w-full max-w-xl rounded-xl shadow-lg p-6 flex flex-col items-center"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="flex flex-col items-center gap-4 w-full bg-black/60 rounded-xl p-6">
        <a href="https://zeno.fm/eclipsefm1063" target="_blank" rel="noopener noreferrer">
          <img
            src={coverUrl}
            alt="ECLIPSE FM"
            className="w-32 h-32 rounded-lg shadow-lg mb-2 border-4 border-white"
          />
        </a>
        <h2 className="text-2xl font-bold text-white mb-1">
          <a href="https://zeno.fm/eclipsefm1063" target="_blank" rel="noopener noreferrer">
            ECLIPSE FM
          </a>
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handlePlayPause}
            className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl shadow-lg hover:bg-blue-700 transition"
            aria-label={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? (
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20"><rect x="4" y="4" width="4" height="12"/><rect x="12" y="4" width="4" height="12"/></svg>
            ) : (
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20"><polygon points="5,4 15,10 5,16"/></svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            className="w-32 accent-blue-600"
            aria-label="Volumen"
          />
        </div>
        <audio
          ref={audioRef}
          src={streamUrl}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          style={{ display: "none" }}
        />
        <div className="text-white text-sm mt-4">
          <span>Radio Eclipse 106.3 · Canelones, Uruguay</span>
        </div>
      </div>
    </div>
  );
}