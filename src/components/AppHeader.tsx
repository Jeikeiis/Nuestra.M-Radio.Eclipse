import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, useCallback } from "react";
import { FaBroadcastTower } from "react-icons/fa";
import "./AppHeader.css";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });
const RadioDashboard = dynamic(() => import("./RadioDashboard"), { ssr: false });

// Menú de navegación profesional básico
const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "#programacion", label: "Programación" },
  { href: "#locutores", label: "Locutores" },
];

type AppHeaderProps = {
  radioOpen: boolean;
  setRadioOpen: (open: boolean) => void;
};

const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  ({ radioOpen, setRadioOpen }, ref) => {
    // Scroll suave a la sección
    const handleNavClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith("#")) {
          e.preventDefault();
          const id = href.replace("#", "");
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      },
      []
    );

    return (
      <header
        ref={ref as any}
        className="app-header"
        role="banner"
        aria-label="Encabezado principal"
      >
        <div className="app-header-inner">
          <div className="app-header-logo-info">
            <Link
              href="/"
              title="Ir a inicio"
              tabIndex={0}
              aria-label="Ir a inicio"
            >
              <Image
                src="/NuestraManana2.0.webp"
                alt="Logo Nuestra Mañana FM 106.3"
                width={120}
                height={120}
                className="app-header-logo"
                priority
              />
            </Link>
            <div className="app-header-info">
              <h1 className="app-header-title">Nuestra Mañana FM 106.3</h1>
              <p className="app-header-subtitle">
                Lunes a Viernes de 10 a 13 horas
              </p>
              <nav
                className="app-header-nav"
                aria-label="Navegación principal"
              >
                <ul className="app-header-nav-list">
                  {NAV_LINKS.map((link) => (
                    <li key={link.href} className="app-header-nav-item">
                      {link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="app-header-nav-link"
                          onClick={(e) => handleNavClick(e, link.href)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="app-header-nav-link"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
          <div className="app-header-actions">
            <button
              className="app-header-radio-btn"
              onClick={() => setRadioOpen(!radioOpen)}
              aria-pressed={radioOpen}
              aria-label="Escuchar radio en vivo"
              title="Escuchar radio en vivo"
            >
              <FaBroadcastTower
                style={{
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
              />
              Radio en Vivo
            </button>
            <div className="app-header-theme-toggle">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
    );
  }
);

export default AppHeader;