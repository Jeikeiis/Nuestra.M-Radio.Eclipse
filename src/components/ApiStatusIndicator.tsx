import React from "react";

export type ApiStatus = "ok" | "cooldown" | "fallback";

interface ApiStatusIndicatorProps {
  status: ApiStatus;
  style?: React.CSSProperties;
  className?: string;
}

const COLORS = {
  ok: { color: "#888", boxShadow: "0 0 4px 1px #8888", label: "API disponible" },
  cooldown: { color: "orange", boxShadow: "0 0 6px 2px #ff9800aa", label: "API en cooldown, usando cache temporal" },
  fallback: { color: "red", boxShadow: "0 0 8px 2px #ff0000cc", label: "API tokens agotados, usando cache fijo" },
};

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ status, style, className }) => {
  const { color, boxShadow, label } = COLORS[status] || COLORS.ok;
  return (
    <span
      title={label}
      style={{
        position: 'absolute',
        top: 6,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow,
        zIndex: 10,
        display: 'inline-block',
        transition: 'background 0.3s',
        ...style,
      }}
      className={className}
      aria-label={label}
    />
  );
};

export default ApiStatusIndicator;
