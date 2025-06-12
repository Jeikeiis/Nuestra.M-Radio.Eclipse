"use client";
import "./globals.css";
import { AudioContext, AudioContextType } from "./page";
import { createContext, useRef, useState, useEffect } from "react";
import AppHeader from "../components/AppHeader";

// Nuevo contexto solo para el estado de hidratación
export const HydrationContext = createContext(false);
export const ThemeContext = createContext({
  darkMode: true,
  setDarkMode: (v: boolean) => {},
});
// Añade contexto para radioOpen
export const RadioDashboardContext = createContext<{
  radioOpen: boolean;
  setRadioOpen: (v: boolean) => void;
}>({
  radioOpen: false,
  setRadioOpen: () => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado global para el audio
  const audioRef = useRef<HTMLAudioElement>(null); // sin null en el tipo genérico
  const streamUrl = "https://stream.zeno.fm/we6d4vg2198uv";
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);

  // Estado para controlar el preloader
  const [hydrated, setHydrated] = useState(false);

  // Estado global de tema
  const [darkMode, setDarkMode] = useState(true);
  const [radioOpen, setRadioOpen] = useState(false);

  useEffect(() => {
    // Forzar modo oscuro en el html al cargar
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");

    // Solo mostrar el preloader hasta hidratar, sin manipular el scroll
    setHydrated(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
    else setDarkMode(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Sincronizar con el vivo
  const handleSyncLive = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("mediaSession" in navigator) {
      const updateMetadata = () => {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: "Nuestra Mañana FM 106.3",
          artist: "Canelones, Uruguay",
          album: "Radio en vivo",
          artwork: [
            { src: "/NuestraManana2.0.webp", sizes: "512x512", type: "image/webp" }
          ]
        });
      };
      updateMetadata();
      navigator.mediaSession.setActionHandler("play", () => {
        if (audioRef.current) audioRef.current.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (audioRef.current) audioRef.current.pause();
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        if (audioRef.current) audioRef.current.pause();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        handleSyncLive();
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (audioRef.current && typeof details.seekTime === "number") {
          audioRef.current.currentTime = details.seekTime;
        }
      });
      return () => {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      };
    }
  }, [playing]);

  // Proveer el contexto de audio a toda la app
  const audioContextValue: AudioContextType = {
    playing,
    setPlaying,
    volume,
    setVolume,
    error,
    setError,
    handleSyncLive,
    audioRef: audioRef as React.RefObject<HTMLAudioElement>,
  };

  return (
    <html lang="es" className={darkMode ? "dark" : ""}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/webp" href="/favicon.webp" />
        {/* Preload imágenes críticas */}
        {/* <link rel="preload" as="image" href="/NuestraManana2.0.webp" /> */}
        {/* <link rel="preload" as="image" href="/RadioEclipse2.0.webp" /> */}
        {/* ...otros preloads si tienes más recursos críticos... */}
      </head>
      <body className="app-root">
        <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
          <RadioDashboardContext.Provider value={{ radioOpen, setRadioOpen }}>
            <AppHeader radioOpen={radioOpen} setRadioOpen={setRadioOpen} />
            <HydrationContext.Provider value={hydrated}>
              {!hydrated && (
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    background: "#000",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.2s",
                  }}
                  aria-label="Cargando contenido"
                >
                  <div style={{ textAlign: "center" }}>
                    <img src="/NuestraManana2.0.webp" alt="Cargando..." width={90} height={90} style={{ margin: "0 auto" }} />
                    <div style={{ marginTop: 16, fontWeight: 700, fontSize: 18 }}>Cargando...</div>
                  </div>
                </div>
              )}
              {/* Audio global siempre presente */}
              <audio
                ref={audioRef}
                src={streamUrl}
                preload="auto"
                style={{ display: "none" }}
                onPlay={() => { setPlaying(true); setError(false); }}
                onPause={() => setPlaying(false)}
                onError={() => setError(true)}
                controls={false}
                crossOrigin="anonymous"
                playsInline
                autoPlay={playing}
              />
              <AudioContext.Provider value={audioContextValue}>
                <div>
                  {children}
                </div>
              </AudioContext.Provider>
            </HydrationContext.Provider>
          </RadioDashboardContext.Provider>
        </ThemeContext.Provider>
      </body>
    </html>
  );
}
