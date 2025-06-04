import Image from "next/image";
import "./Footer.css";

export default function AppFooter() {
  return (
    <footer>
      <div className="footer-logo-info">
        <Image
          src="/RadioEclipse2.0.webp"
          alt="Radio Eclipse 106.3"
          width={90}
          height={90}
          className="footer-logo-img"
          priority={false}
        />
        <div className="footer-info-text">
          <span className="footer-title">Radio Eclipse 106.3</span>
          <span className="footer-location">Canelones, Uruguay</span>
        </div>
      </div>
      <div className="footer-credits">
        <span className="footer-copyright">
          © {new Date().getFullYear()}{" "}
          <a
            href="https://nuestramananaradioeclipse-git-main-jeikeiis-projects.vercel.app/"
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
    </footer>
  );
}