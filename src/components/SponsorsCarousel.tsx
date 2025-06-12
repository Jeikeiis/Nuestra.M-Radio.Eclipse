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
  const [containerWidth, setContainerWidth] = useState(0);
  const [mounted, setMounted] = useState(false); // NUEVO

  // Duplicar sponsors para loop infinito
  const sponsorsLoop = [...sponsors, ...sponsors];

  useEffect(() => {
    setMounted(true); // Marca como montado en cliente
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function updateWidths() {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.scrollWidth / 2);
        setContainerWidth(trackRef.current.parentElement?.offsetWidth || 0);
      }
    }
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let raf: number;
    let pos = offset;
    const speed = isMobile() ? 0.2 : 0.7;

    function animate() {
      pos += speed;
      // Loop infinito suave: cuando el offset supera la mitad, restamos la mitad (ancho de un set de sponsors)
      if (trackWidth > 0 && pos >= trackWidth) {
        pos -= trackWidth;
      }
      setOffset(pos);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [trackWidth, mounted]);

  if (!mounted) return null; // No renderizar en SSR

  return (
    <div className="sponsors-carousel-outer">
      <div
        className="sponsors-carousel-track"
        ref={trackRef}
        style={{
          transform: `translateX(-${offset}px)`,
        }}
      >
        {sponsorsLoop.map((s, i) => (
          <SponsorItem key={i} src={s.src} alt={s.alt} />
        ))}
      </div>
    </div>
  );
}