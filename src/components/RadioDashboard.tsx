// VERSIÓN ANTERIOR (sin Modal, panel flotante propio)
// IMPORTANTE: Si quieres volver a la versión profesionalizada con Modal, descomenta el bloque inferior.

import React, { useEffect, useRef } from "react";
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
 * Panel de control para la radio en vivo (versión anterior, sin Modal).
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
  // Manejo de Escape para cerrar el panel
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  /**
   * Alterna la reproducción/pausa del audio.
   */
  const handlePlayPause = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setPlaying(true);
        setError(false);
      } catch (err) {
        setError(true);
      }
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
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      ref={panelRef}
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
          {/* Icono close siempre blanco y visible */}
          <svg width="28" height="28" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#ff4d4f" />
            <path
              d="M16 8L8 16M8 8l8 8"
              stroke="#fff"
              strokeWidth="2.2"
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
            {/* Iconos play/pause siempre blancos y claros */}
            {playing ? (
              <svg width="28" height="28" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#ff4d4f" />
                <rect
                  x="8"
                  y="7"
                  width="3.5"
                  height="10"
                  rx="1.2"
                  fill="#fff"
                />
                <rect
                  x="12.5"
                  y="7"
                  width="3.5"
                  height="10"
                  rx="1.2"
                  fill="#fff"
                />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill="#ff4d4f" />
                <polygon points="9,7 18,12 9,17" fill="#fff" />
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
            style={{
              width: "8rem",
              maxWidth: 120,
              paddingRight: 9,
              paddingLeft: 9,
            }}
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
        {error && <span className="radio-dashboard-error">Error de señal</span>}
      </div>
    </section>
  );
};

export default RadioDashboard;

/*
// VERSIÓN PROFESIONALIZADA CON MODAL (descomenta para usar)
import Modal from "./Modal";
...
return (
  <Modal
    open={true}
    onClose={onClose || (() => {})}
    title="Radio en vivo Nuestra Mañana FM 106.3"
    ariaLabel="Radio en vivo Nuestra Mañana FM 106.3"
    className="radio-dashboard-modal"
    maxWidth={480}
    minWidth={320}
  >
    ...contenido...
  </Modal>
);
*/