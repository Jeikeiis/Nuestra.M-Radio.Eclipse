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
  { src: "/ChiariaPizzi.webp", alt: "Estudio Jurídico Notarial Chiara Pizzi" }, // Nuevo sponsor actualizado a webp
  { src: "/GiannattasioAcademia.webp", alt: "Academia de Choferes Giannattasio" }, // Sponsor agregado
  // Puedes agregar más sponsors aquí
];

function SponsorItem({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="sponsor-carousel-item">
      <Image
        src={src}
        alt={alt}
        width={160}
        height={160}
        className="footer-sponsor-img"
        draggable={false}
      />
    </div>
  );
}

export default function SponsorsCarousel() {
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Duplicar sponsors para loop infinito
  const sponsorsLoop = [...sponsors, ...sponsors];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function updateWidths() {
      if (trackRef.current) {
        // Usa el ancho real del track dividido por 2 (por el loop)
        setTrackWidth(trackRef.current.scrollWidth / 2);
      }
    }
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let interval: number;
    let pos = offset;
    const speed = 0.3; // px por frame, mucho más lento
    const fps = 30; // Limitar a 30 FPS
    function animate() {
      pos += speed;
      if (trackWidth > 0 && pos >= trackWidth) {
        pos -= trackWidth;
      }
      setOffset(pos);
    }
    interval = window.setInterval(animate, 1000 / fps); // 30 FPS
    return () => clearInterval(interval);
  }, [trackWidth, mounted]);

  if (!mounted) return null;

  return (
    <div className="sponsors-carousel-outer">
      <div
        className="sponsors-carousel-track"
        ref={trackRef}
        style={{
          transform: `translateX(-${offset}px)`,
          minWidth: "100%",
        }}
      >
        {sponsorsLoop.map((s, i) => (
          <SponsorItem key={i} src={s.src} alt={s.alt} />
        ))}
      </div>
    </div>
  );
}