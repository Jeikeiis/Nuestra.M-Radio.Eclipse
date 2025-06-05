import Image from "next/image";
import "./Footer.css";
import SponsorsCarousel from "./SponsorsCarousel";

export default function AppFooter() {
  return (
    <footer>
      <div className="footer-content-layout">
        {/* Logo e info a la izquierda */}
        <div className="footer-logo-info">
          <Image
            src="/RadioEclipse2.0.webp"
            alt="Radio Eclipse 106.3"
            width={90}
            height={90}
            priority={false}
          />
          <div className="footer-info-text">
            <span className="footer-title">Radio Eclipse 106.3</span>
            <span className="footer-location">Canelones, Uruguay</span>
          </div>
        </div>
        {/* Sponsors al centro */}
        <div className="footer-sponsors">
          <SponsorsCarousel />
        </div>
        {/* Créditos a la derecha */}
        <div className="footer-credits footer-credits-right">
          <span className="footer-copyright">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://nuestramananaradioeclipse.vercel.app/"
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
        </div>
      </div>
    </footer>
  );
}