"use client";
import AppFooter from "../components/AppFooter";
import { createContext, useContext, useState } from "react";
import ProgramacionSection from "../components/ProgramacionSection";
import LocutoresSection from "../components/LocutoresSection";
import PodcastsSection from "../components/PodcastsSection";
import EventosSection from "../components/EventosSection";
import ContactoSection from "../components/ContactoSection";
import RadioDashboard from "../components/RadioDashboard";
import { HydrationContext, RadioDashboardContext } from "./layout";

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

export default function Home() {
  const audio = useContext(AudioContext);
  const hydrated = useContext(HydrationContext);
  const { radioOpen, setRadioOpen } = useContext(RadioDashboardContext);

  return (
    <div>
      {/* Secciones principales */}
      <main className="main-content">
        <ProgramacionSection />
        <LocutoresSection />
        <PodcastsSection />
        <EventosSection />
        <ContactoSection />
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
  );
}