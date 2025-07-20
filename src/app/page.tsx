"use client";
import { createContext, useContext } from "react";
import ProgramacionSection from "@/components/ProgramacionSection";
import LocutoresSection from "@/components/LocutoresSection";
import RadioDashboard from "@/components/RadioDashboard";
import ClasicosDelRecuerdoSection from "@/components/ClasicosDelRecuerdoSection";
import { HydrationContext, RadioDashboardContext } from "@/context/AppContexts";

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
  streamLoading?: boolean;
  streamPreloaded?: boolean;
};
export const AudioContext = createContext<AudioContextType | null>(null);

export const ThemeContext = createContext({
  darkMode: true,
  setDarkMode: (v: boolean) => {},
});

export default function Home() {
  const hydrated = useContext(HydrationContext);
  const { radioOpen, setRadioOpen } = useContext(RadioDashboardContext);

  return (
    <div>
      {/* Secciones principales */}
      <main className="main-content">
        <LocutoresSection />
        <ClasicosDelRecuerdoSection />
        <ProgramacionSection />
        {/* <PodcastsSection />
        <EventosSection />
        <ContactoSection /> */}
      </main>
      {/* Pie de página */}
    </div>
  );
}