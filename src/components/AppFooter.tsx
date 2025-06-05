import Image from "next/image";
import "./Footer.css";

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
          <div className="footer-sponsors-inner">
            <a
              href="javascript:void(0);"
              tabIndex={-1}
              className="footer-sponsor-item"
            >
              <img
                src="/SanitariaNunez.webp"
                alt="Sanitaria Nuñez"
                className="footer-sponsor-img"
              />
            </a>
            <a
              href="javascript:void(0);"
              tabIndex={-1}
              className="footer-sponsor-item"
            >
              <img
                src="/MirandaConstruccion.webp"
                alt="Miranda Construcciones"
                className="footer-sponsor-img"
              />
            </a>
            {/* Agrega más sponsors aquí si lo deseas */}
          </div>
        </div>
        {/* Créditos a la derecha */}
        <div className="footer-credits footer-credits-right">
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
      </div>
    </footer>
  );
}