import dynamic from "next/dynamic";
import Image from "next/image";
import { forwardRef } from "react";
import "./AppHeader.css";

const ThemeToggle = dynamic(() => import("./ThemeToggle"), { ssr: false });
const RadioDashboard = dynamic(() => import("./RadioDashboard"), { ssr: false });

type AppHeaderProps = {
  radioOpen: boolean;
  setRadioOpen: (open: boolean) => void;
};

const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  ({ radioOpen, setRadioOpen }, ref) => (
    <header ref={ref as any} className="app-header">
      <div className="app-header-inner">
        <div className="app-header-logo-info">
          <Image
            src="/NuestraManana2.0.webp"
            alt="Logo Nuestra Mañana FM 106.3"
            width={120}
            height={120}
            className="app-header-logo"
            priority
          />
          <div className="app-header-info">
            <h1 className="app-header-title">Nuestra Mañana FM 106.3</h1>
            <p className="app-header-subtitle">Lunes a Viernes de 10 a 13 horas</p>
          </div>
        </div>
        <div className="app-header-actions">
          <button
            className="app-header-radio-btn"
            onClick={() => setRadioOpen(!radioOpen)}
          >
            Radio en Vivo
          </button>
          <div className="app-header-theme-toggle">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
);

export default AppHeader;