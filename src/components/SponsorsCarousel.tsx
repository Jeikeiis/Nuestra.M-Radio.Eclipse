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
  // Puedes agregar más sponsors aquí
];

function SponsorItem({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="sponsor-carousel-item"
      style={{ flex: "0 0 auto", position: "relative" }}
    >
      <Image
        src={src}
        alt={alt}
        width={110}
        height={110}
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

  // Duplicar sponsors para loop infinito
  const sponsorsLoop = [...sponsors, ...sponsors];

  useEffect(() => {
    function updateWidths() {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.scrollWidth / 2); // solo la mitad (un loop)
        setContainerWidth(trackRef.current.parentElement?.offsetWidth || 0);
      }
    }
    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, []);

  useEffect(() => {
    let raf: number;
    let pos = offset;
    const speed = isMobile() ? 0.5 : 1.5; // píxeles por frame

    function animate() {
      pos += speed;
      if (trackWidth > 0 && pos >= trackWidth) {
        pos = 0;
      }
      setOffset(pos);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackWidth]);

  return (
    <div
      className="sponsors-carousel-outer"
      style={{ overflow: "hidden", width: "100%" }}
    >
      <div
        className="sponsors-carousel-track"
        ref={trackRef}
        style={{
          display: "flex",
          width: sponsorsLoop.length * 120, // 110px img + margen
          transform: `translateX(-${offset}px)`,
          transition: "none",
        }}
      >
        {sponsorsLoop.map((s, i) => (
          <SponsorItem key={i} src={s.src} alt={s.alt} />
        ))}
      </div>
    </div>
  );
}

// Revisa SponsorsCarousel.css para eliminar box-shadow/backdrop-filter si existen