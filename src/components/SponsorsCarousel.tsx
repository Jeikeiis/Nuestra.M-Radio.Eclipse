import Image from "next/image";
import { useEffect, useRef, RefObject } from "react";

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
  const trackRef = useRef<HTMLDivElement>(null);

  // Animación de scroll horizontal
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let animationFrame: number;
    let scrollAmount = 0;
    let frame = 0;
    const mobile = isMobile();
    const speed = mobile ? 0.08 : 0.25;
    function animate() {
      if (!track) return;
      if (mobile) {
        // Solo animar cada 2 frames para reducir carga
        frame = (frame + 1) % 2;
        if (frame !== 0) {
          animationFrame = requestAnimationFrame(animate);
          return;
        }
      }
      scrollAmount += speed;
      if (scrollAmount >= track.scrollWidth / 2) {
        scrollAmount = 0;
      }
      track.scrollLeft = scrollAmount;
      animationFrame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const sponsorsLoop = [...sponsors, ...sponsors];

  return (
    <div
      className="sponsors-carousel-outer"
      style={{ overflow: "hidden", width: "100%" }}
    >
      <div
        className="sponsors-carousel-track"
        ref={trackRef}
        style={{ display: "flex", width: "max-content" }}
      >
        {sponsorsLoop.map((s, i) => (
          <SponsorItem key={i} src={s.src} alt={s.alt} />
        ))}
      </div>
    </div>
  );
}