"use client";
import "./globals.css";
import { useRef, useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import RadioDashboard from "@/components/RadioDashboard";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { HydrationContext, ThemeContext, RadioDashboardContext } from "@/context/AppContexts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Estado global para el audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamUrl = "https://stream.zeno.fm/we6d4vg2198uv";
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(false);
  // Estado para controlar el preloader
  const [hydrated, setHydrated] = useState(false);
  // Estado global de tema
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") !== "light";
    }
    return true;
  });
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioSyncDone, setRadioSyncDone] = useState(false);

  useEffect(() => {
    setHydrated(true);
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

  // Persistencia de volumen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("radioVolume");
      if (saved !== null) setVolume(Number(saved));
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("radioVolume", String(volume));
    }
  }, [volume]);

  // Sincronización automática al abrir el panel por primera vez
  useEffect(() => {
    if (radioOpen && !radioSyncDone) {
      handleSyncLive();
      setRadioSyncDone(true);
    }
    // Eliminado el reset de radioSyncDone al cerrar el panel
  }, [radioOpen]);

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

  return (
    <html lang="es" className={hydrated ? (darkMode ? "dark" : "") : ""}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/webp" href="/favicon.webp" />
        {/* Google Analytics profesional */}
        <GoogleAnalytics />
        {/* Preload imágenes críticas */}
        {/* <link rel="preload" as="image" href="/NuestraManana2.0.webp" /> */}
        {/* <link rel="preload" as="image" href="/RadioEclipse2.0.webp" /> */}
        {/* ...otros preloads si tienes más recursos críticos... */}
      </head>
      <body className="app-root">
        <div className="site-container">
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
                <div>
                  {children}
                  {/* Panel de RadioDashboard fijo sobre el footer */}
                  {hydrated && radioOpen && (
                    <RadioDashboard
                      playing={playing}
                      setPlaying={setPlaying}
                      volume={volume}
                      setVolume={setVolume}
                      error={error}
                      setError={setError}
                      onClose={() => setRadioOpen(false)}
                      onSyncLive={handleSyncLive}
                      audioRef={audioRef}
                    />
                  )}
                  <AppFooter />
                </div>
              </HydrationContext.Provider>
            </RadioDashboardContext.Provider>
          </ThemeContext.Provider>
        </div>
      </body>
    </html>
  );
}
