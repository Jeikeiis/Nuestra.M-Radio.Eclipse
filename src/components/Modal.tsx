import React, { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  maxWidth?: string | number;
  minWidth?: string | number;
  className?: string;
}

/**
 * Modal profesional reutilizable y accesible para toda la app.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  icon,
  children,
  ariaLabel,
  maxWidth = "95vw",
  minWidth = 320,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus al abrir
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Bloqueo robusto del scroll del body mientras el modal está abierto
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalOverscroll = document.body.style.overscrollBehavior;
      const originalScrollX = document.body.style.overflowX;
      // Solo bloquear el body si no es móvil
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
      if (!isMobile) {
        document.body.style.overflow = "hidden";
        document.body.style.overflowX = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100vw";
        document.body.style.overscrollBehavior = "none";
      } else {
        document.body.style.overflow = "hidden";
        document.body.style.overflowX = "hidden";
        document.body.style.overscrollBehavior = "none";
      }
      // Prevenir scroll en iOS/Safari solo si no es móvil
      if (!isMobile) {
        document.body.addEventListener('touchmove', preventScroll, { passive: false });
      }
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.overscrollBehavior = originalOverscroll;
        document.body.style.overflowX = originalScrollX;
        if (!isMobile) {
          document.body.removeEventListener('touchmove', preventScroll);
        }
      };
    }
    function preventScroll(e: TouchEvent) {
      e.preventDefault();
    }
  }, [open]);

  if (!open) return null;

  // Detectar móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  // --- OPTIMIZACIÓN: Eliminar blur y animación en móviles, usar clases CSS ---
  const modalClass = `programacion-modal${isMobile ? ' programacion-modal--mobile' : ''} ${className}`;
  const contentClass = `programacion-modal-content${isMobile ? ' programacion-modal-content--mobile' : ''}`;

  return (
    <div
      className={modalClass}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title || "Modal"}
      tabIndex={-1}
      ref={modalRef}
      onClick={onClose}
      style={isMobile ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30,32,38,0.92)",
        overflow: 'hidden',
        overscrollBehavior: 'none',
      } : {
        zIndex: 2000,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(30,32,38,0.92)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: 'hidden',
        overscrollBehavior: 'none',
      }}
    >
      <div
        className={contentClass}
        style={isMobile ? {
          maxWidth: '100vw',
          minWidth: 0,
          width: '100vw',
          maxHeight: '100vh',
          height: 'auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          padding: '1.2rem 0.5rem 1.2rem 0.5rem',
          border: 'none',
          WebkitOverflowScrolling: 'touch',
        } : {
          maxWidth: maxWidth,
          minWidth: minWidth,
          maxHeight: "90vh",
          height: "auto",
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          animation: "modalIn 0.22s cubic-bezier(.4,1.2,.6,1)",
          padding: "2rem 2.5rem 2rem 2.5rem",
          border: "none",
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="modal-btn"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#b71c1c",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            fontSize: 22,
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          ×
        </button>
        {(icon || title) && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            {icon && <span style={{ fontSize: "2rem" }}>{icon}</span>}
            {title && <span style={{ fontWeight: 700, fontSize: "1.3rem" }}>{title}</span>}
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
