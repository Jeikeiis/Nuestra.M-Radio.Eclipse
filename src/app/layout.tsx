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
    <html lang="es">
      <head>
        <link rel="icon" type="image/webp" href="/favicon.webp" />
      </head>
      <body className="bg-white text-black dark:bg-black dark:text-white transition-colors">
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
          {children}
        </AudioContext.Provider>
      </body>
    </html>
  );
}
