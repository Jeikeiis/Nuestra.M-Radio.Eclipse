"use client";
import "./globals.css";
import { AudioContext, AudioContextType } from "./page";
import { useRef, useState, useEffect } from "react";

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

  useEffect(() => {
    // Forzar modo oscuro en el html al cargar
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");

    // Golpea el fondo y vuelve al top varias veces para asegurar el layout,
    // pero mantiene el scroll en top antes de mostrar la app
    let count = 0;
    const max = 3;
    let finalTopTimeout: NodeJS.Timeout | number;

    function bounceScroll() {
      window.scrollTo(0, 99999);
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (document.scrollingElement) {
          document.scrollingElement.scrollTop = 0;
        }
        count++;
        if (count < max) {
          setTimeout(bounceScroll, 120);
        } else {
          // Mantener el scroll en el top durante el preloader
          finalTopTimeout = setInterval(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            if (document.scrollingElement) {
              document.scrollingElement.scrollTop = 0;
            }
          }, 60);
          setTimeout(() => {
            clearInterval(finalTopTimeout);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            if (document.scrollingElement) {
              document.scrollingElement.scrollTop = 0;
            }
            setHydrated(true);
          }, 650);
        }
      }, 120);
    }
    bounceScroll();

    return () => {
      if (finalTopTimeout) clearInterval(finalTopTimeout);
    };
  }, []);

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
    <html lang="es" className="dark">
      <head>
        <link rel="icon" type="image/webp" href="/favicon.webp" />
        {/* Preload imágenes críticas */}
        <link rel="preload" as="image" href="/NuestraManana2.0.webp" />
        <link rel="preload" as="image" href="/RadioEclipse2.0.webp" />
        {/* ...otros preloads si tienes más recursos críticos... */}
      </head>
      <body className="bg-white text-black dark:bg-black dark:text-white transition-colors">
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
          {/* Oculta el contenido hasta que esté hidratado */}
          <div style={{ opacity: hydrated ? 1 : 0, transition: "opacity 0.2s" }}>
            {children}
          </div>
        </AudioContext.Provider>
      </body>
    </html>
  );
}
