"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { createContext, useContext, useRef, useLayoutEffect, useState, useEffect } from "react";
import ProgramacionSection from "../components/ProgramacionSection";
import LocutoresSection from "../components/LocutoresSection";
import PodcastsSection from "../components/PodcastsSection";
import EventosSection from "../components/EventosSection";
import ContactoSection from "../components/ContactoSection";
import RadioDashboard from "../components/RadioDashboard";
import { HydrationContext } from "./layout";

// Definir el tipo del contexto de audio
export type AudioContextType = {
  playing: boolean;
  setPlaying: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  error: boolean;
  setError: (v: boolean) => void;
  handleSyncLive: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
};
export const AudioContext = createContext<AudioContextType | null>(null);

export const ThemeContext = createContext({
  darkMode: true,
  setDarkMode: (v: boolean) => {},
});

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 640;
}

export default function Home() {
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [radioOpen, setRadioOpen] = useState(false);

  // Consumir el contexto de audio global
  const audio = useContext(AudioContext);
  const hydrated = useContext(HydrationContext);

  // Evita el style dinámico en SSR para evitar hydration mismatch
  // Siempre renderiza style={{paddingTop: 0}} en SSR y solo cambia en cliente
  const [clientPaddingTop, setClientPaddingTop] = useState(0);

  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") setDarkMode(false);
    else setDarkMode(true);
  }, []);

  useLayoutEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
        setClientPaddingTop(headerRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight, { passive: true });
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div>
        {/* Encabezado */}
        <AppHeader ref={headerRef} radioOpen={radioOpen} setRadioOpen={setRadioOpen} />

        {/* Secciones principales */}
        <main
          className="main-content"
          style={{ paddingTop: headerHeight }}
        >
          <ProgramacionSection />
          <LocutoresSection />
          <PodcastsSection />
        </main>
        {/* Panel de RadioDashboard fijo sobre el footer */}
        {hydrated && radioOpen && audio && (
          <RadioDashboard
            playing={audio.playing}
            setPlaying={audio.setPlaying}
            volume={audio.volume}
            setVolume={audio.setVolume}
            error={audio.error}
            setError={audio.setError}
            onClose={() => setRadioOpen(false)}
            onSyncLive={audio.handleSyncLive}
            audioRef={audio.audioRef}
          />
        )}
        {/* Pie de página */}
        <AppFooter />
      </div>
    </ThemeContext.Provider>
  );
}