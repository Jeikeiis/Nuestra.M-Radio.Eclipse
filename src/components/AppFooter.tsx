import Image from "next/image";
import "./AppFooter.css";
import SponsorsCarousel from "./SponsorsCarousel";
import { useEffect, useState } from "react";

export default function AppFooter() {
  const [sintonizados, setSintonizados] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/noticias")
      .then((res) => res.json())
      .then((data) => {
        // Solo cuenta la visita si la respuesta trae sintonizado true
        if (typeof window !== "undefined") {
          // Guarda en sessionStorage para no contar varias veces por usuario en la sesión
          if (data.sintonizado && !sessionStorage.getItem("sintonizado")) {
            sessionStorage.setItem("sintonizado", "1");
          }
        }
      });

    // Obtener el total de sintonizados (solo para mostrar, no es exacto ni persistente)
    fetch("/api/sintonizados")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.total === "number") setSintonizados(data.total);
      })
      .catch(() => setSintonizados(null));
  }, []);

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <Image
            src="/RadioEclipse2.0.webp"
            alt="Radio Eclipse 106.3"
            width={160}
            height={160}
            priority
          />
        </div>
        <div className="footer-sponsors">
          <SponsorsCarousel />
        </div>
        <div className="footer-credits">
          <span>
            © {new Date().getFullYear()}{" "}
            <a
              href="https://zeno.fm/radio/eclipsefm1063/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Radio Eclipse FM 106.3
            </a>
          </span>
          <span className="footer-madeby">
            Hecho por Jeikeiis con{" "}
            <span className="footer-heart">♥</span> y Next.js
          </span>
          <span
            className="footer-stats"
            style={{
              fontSize: "0.95rem",
              marginTop: "0.4rem",
              color: "#e53935",
              fontWeight: 600,
            }}
          >
            {sintonizados !== null
              ? `Oyentes: ${sintonizados}`
              : "Cargando estadísticas..."}
          </span>
        </div>
      </div>
    </footer>
  );
}