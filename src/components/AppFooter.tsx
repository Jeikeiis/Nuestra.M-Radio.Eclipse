import Image from "next/image";
import "./AppFooter.css";
import SponsorsCarousel from "./SponsorsCarousel";

export default function AppFooter() {
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
        </div>
      </div>
    </footer>
  );
}