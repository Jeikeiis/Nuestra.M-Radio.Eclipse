"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { createContext, useContext, useRef, useLayoutEffect, useState } from "react";
import ProgramacionSection from "../components/ProgramacionSection";
import LocutoresSection from "../components/LocutoresSection";
import PodcastsSection from "../components/PodcastsSection";
import EventosSection from "../components/EventosSection";
import ContactoSection from "../components/ContactoSection";
import RadioDashboard from "../components/RadioDashboard";

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

  // Evita el style dinámico en SSR para evitar hydration mismatch
  // Siempre renderiza style={{paddingTop: 0}} en SSR y solo cambia en cliente
  const [clientPaddingTop, setClientPaddingTop] = useState(0);

  useLayoutEffect(() => {
    let scrollLock = true;
    let unlockTimeout: NodeJS.Timeout | number;
    let interval: NodeJS.Timeout | number;

    function forceScrollTop() {
      if (scrollLock) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (document.scrollingElement) {
          document.scrollingElement.scrollTop = 0;
        }
      }
    }

    function updateHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
        if (isMobile()) {
          document.body.style.paddingTop = headerRef.current.offsetHeight + "px";
        } else {
          document.body.style.paddingTop = "";
        }
        // Solo en cliente, actualiza el paddingTop del div
        setClientPaddingTop(isMobile() ? 0 : headerRef.current.offsetHeight);
      }
      forceScrollTop();
    }

    updateHeight();
    window.addEventListener("resize", updateHeight, { passive: true });

    interval = setInterval(forceScrollTop, 60);

    unlockTimeout = setTimeout(() => {
      scrollLock = false;
      clearInterval(interval);
    }, 1500);

    setTimeout(forceScrollTop, 0);

    return () => {
      window.removeEventListener("resize", updateHeight);
      document.body.style.paddingTop = "";
      clearInterval(interval);
      clearTimeout(unlockTimeout);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ paddingTop: clientPaddingTop }}
    >
      {/* Encabezado */}
      <AppHeader ref={headerRef} radioOpen={radioOpen} setRadioOpen={setRadioOpen} />

      {/* Espacio extra debajo del header */}
      <div style={{ height: 24 }} />

      <main className="flex-1 flex flex-col items-center justify-start px-4 pb-10 gap-12 w-full">
        {/* Menú de información */}
        <ProgramacionSection />
        {/* Sección de locutores */}
        <LocutoresSection />
        {/* Sección de podcasts */}
        <PodcastsSection />
        {/* Sección de galería de eventos */}
        <EventosSection />
        {/* Sección de contacto */}
        <ContactoSection />
      </main>
      {/* Panel de RadioDashboard fijo sobre el footer */}
      {radioOpen && audio && (
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
  );
}