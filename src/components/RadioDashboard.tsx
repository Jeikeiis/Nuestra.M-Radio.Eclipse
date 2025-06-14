import React from "react";
import "./RadioDashboard.css";

export interface RadioDashboardProps {
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  error: boolean;
  setError: (error: boolean) => void;
  onClose?: () => void;
  onSyncLive: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

/**
 * Panel de control para la radio en vivo.
 */
const RadioDashboard: React.FC<RadioDashboardProps> = ({
  playing,
  setPlaying,
  volume,
  setVolume,
  error,
  setError,
  onClose,
  onSyncLive,
  audioRef,
}) => {
  /**
   * Alterna la reproducción/pausa del audio.
   */
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
      setError(false);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  /**
   * Cambia el volumen del audio.
   */
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <section
      className="radio-dashboard"
      aria-label="Radio en vivo Nuestra Mañana FM 106.3"
    >
      <div className="radio-dashboard-header">
        <div className="radio-dashboard-header-texts">
          <span className="radio-dashboard-title">
            Nuestra Mañana FM 106.3
          </span>
          <span className="radio-dashboard-subtitle">
            En vivo
            <span className="radio-dashboard-subtitle-detail">
              Lunes a Viernes de 10 a 13 hs
            </span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="radio-dashboard-close"
          aria-label="Minimizar reproductor"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="radio-dashboard-controls">
        <div className="radio-dashboard-controls-row">
          <button
            onClick={handlePlayPause}
            className="radio-dashboard-play"
            aria-label={playing ? "Pausar" : "Reproducir"}
          >
            {playing ? (
              <svg width="22" height="22" fill="none" viewBox="0 0 20 20">
                <rect x="4" y="4" width="4" height="12" fill="#fff" />
                <rect x="12" y="4" width="4" height="12" fill="#fff" />
              </svg>
            ) : (
              <svg width="22" height="22" fill="none" viewBox="0 0 20 20">
                <polygon points="5,4 15,10 5,16" fill="#fff" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            className="custom-slider"
            aria-label="Volumen"
            style={{ width: "8rem", maxWidth: 120, paddingRight: 9, paddingLeft: 9 }}
          />
          <button
            onClick={onSyncLive}
            className="radio-dashboard-live"
            aria-label="Sincronizar con el vivo"
            title="Sincronizar con el vivo"
          >
            <span className="radio-dashboard-live-dot"></span>
            <span className="leading-none">Vivo</span>
          </button>
        </div>
        {error && (
          <span className="radio-dashboard-error">Error de señal</span>
        )}
      </div>
    </section>
  );
};

export default RadioDashboard;