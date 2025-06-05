"use client";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { useRef, useLayoutEffect, useState } from "react";
import ProgramacionSection from "../components/ProgramacionSection";
import LocutoresSection from "../components/LocutoresSection";
import PodcastsSection from "../components/PodcastsSection";
import EventosSection from "../components/EventosSection";
import ContactoSection from "../components/ContactoSection";
import SponsorsSection from "../components/SponsorsSection";

export default function Home() {
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    function updateHeight() {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors pt-20"
      style={{ paddingTop: headerHeight }}
    >
      {/* Encabezado */}
      <AppHeader ref={headerRef} />

      {/* Sección principal */}
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

      {/* Pie de página */}
      <AppFooter />
    </div>
  );
}