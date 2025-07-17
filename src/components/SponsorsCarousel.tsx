"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./SponsorsCarousel.css";

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth <= 640;
}

const sponsors = [
  { src: "/SanitariaNunez.webp", alt: "Sanitaria Nuñez" },
  { src: "/MirandaConstruccion.webp", alt: "Miranda Construcciones" },
  { src: "/ChiariaPizzi.webp", alt: "Estudio Jurídico Notarial Chiara Pizzi" },
  { src: "/GiannattasioAcademia.webp", alt: "Academia de Choferes Giannattasio" },
  // Puedes agregar más sponsors aquí
];

const fallbackSponsors = [
  { src: "/file.svg", alt: "Sponsor Genérico" },
];

function SponsorItem({ src, alt }: { src: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <div className="sponsor-carousel-item">
        <div className="footer-sponsor-img" style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#eee',width:80,height:80,borderRadius:'50%',fontWeight:600,fontSize:14,color:'#b71c1c'}}>{alt}</div>
      </div>
    );
  }
  if (src === "/MirandaConstruccion.webp") {
    return (
      <div className="sponsor-carousel-item">
        <a
          href="https://www.instagram.com/miranda_construccion/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={src}
            alt={alt}
            width={160}
            height={160}
            className="footer-sponsor-img"
            draggable={false}
            onError={() => setImgError(true)}
          />
        </a>
      </div>
    );
  }
  return (
    <div className="sponsor-carousel-item">
      <Image
        src={src}
        alt={alt}
        width={160}
        height={160}
        className="footer-sponsor-img"
        draggable={false}
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function SponsorsCarousel() {
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentSponsors, setCurrentSponsors] = useState(sponsors.length > 0 ? sponsors : fallbackSponsors);

  // Duplicar sponsors para loop infinito
  const sponsorsLoop = [...currentSponsors, ...currentSponsors];

  // Reiniciar sponsors si cambia la lista
  useEffect(() => {
    setCurrentSponsors(sponsors.length > 0 ? sponsors : fallbackSponsors);
  }, [sponsors.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Actualizar ancho del track y reiniciar offset si cambia
  useEffect(() => {
    if (!mounted) return;
    function updateWidths() {
      if (trackRef.current) {
        // El ancho real del track es la suma de los hijos (sin dividir por 2)
        setTrackWidth(trackRef.current.scrollWidth / 2);
        setOffset(0); // Reinicia el offset para evitar saltos
      }
    }
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [mounted, currentSponsors.length]);

  // Animación robusta, pausa en hover/touch
  useEffect(() => {
    if (!mounted || paused) return;
    let interval: number;
    let pos = offset;
    const speed = 0.5; // Un poco más rápido para evitar cortes
    const fps = 30;
    function animate() {
      pos += speed;
      if (trackWidth > 0 && pos >= trackWidth) {
        pos -= trackWidth;
      }
      setOffset(pos);
    }
    interval = window.setInterval(animate, 1000 / fps);
    return () => clearInterval(interval);
  }, [trackWidth, mounted, paused]);

  // Limpieza de offset si cambia el número de sponsors
  useEffect(() => {
    setOffset(0);
  }, [currentSponsors.length]);

  if (!mounted) return null;

  // Handlers para pausar/reanudar
  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  return (
    <div
      className="sponsors-carousel-outer"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
      tabIndex={0}
      aria-label="Carrusel de sponsors"
      role="region"
      style={{outline:'none'}}
    >
      <div
        className="sponsors-carousel-track"
        ref={trackRef}
        style={{
          transform: `translateX(-${offset}px)`,
          minWidth: "max-content", // Asegura que el track nunca se corte
          width: "auto",
        }}
      >
        {sponsorsLoop.map((s, i) => (
          <SponsorItem key={i} src={s.src} alt={s.alt} />
        ))}
      </div>
    </div>
  );
}