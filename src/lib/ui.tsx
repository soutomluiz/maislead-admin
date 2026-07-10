import type { CSSProperties, ReactNode } from "react";
import { T } from "../theme";

// ---- Pill de status (porta do pill() do .dc.html) ----
type PillKind =
  | "ativo"
  | "trial"
  | "inad"
  | "pago"
  | "pend"
  | "falhou"
  | "convertido"
  | "emtrial"
  | "ocioso";

const PILL_MAP: Record<PillKind, [string, string, string]> = {
  ativo: ["rgba(16,185,129,.12)", "#059669", "Ativo"],
  trial: ["rgba(245,158,11,.14)", "#c07f0d", "Trial"],
  inad: ["rgba(244,63,94,.12)", "#e11d48", "Inadimplente"],
  pago: ["rgba(16,185,129,.12)", "#059669", "Pago"],
  pend: ["rgba(245,158,11,.14)", "#c07f0d", "Pendente"],
  falhou: ["rgba(244,63,94,.12)", "#e11d48", "Falhou"],
  convertido: ["rgba(16,185,129,.12)", "#059669", "Convertido"],
  emtrial: ["rgba(245,158,11,.14)", "#c07f0d", "Em trial"],
  ocioso: ["rgba(148,163,184,.18)", "#64748b", "Ocioso"],
};

export function Pill({ kind, text }: { kind: PillKind; text?: string }) {
  const [bg, col, label] = PILL_MAP[kind];
  return (
    <span
      style={{
        background: bg,
        color: col,
        fontSize: 11.5,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 20,
      }}
    >
      {text ?? label}
    </span>
  );
}

// ---- cor do health score por faixa ----
export const healthColor = (h: number) =>
  h >= 70 ? T.greenD : h >= 45 ? T.amberD : T.redD;

// ---- shade do cohort (porta do shade() do .dc.html) ----
export function cohortShade(v: number | null): { bg: string; col: string; v: string } {
  if (v === null) return { bg: "#f6f5fb", col: "#f6f5fb", v: "" };
  const t = v / 100;
  return {
    bg: `rgba(109,92,245,${(0.12 + t * 0.78).toFixed(2)})`,
    col: t > 0.5 ? "#fff" : "#4a4568",
    v: v + "%",
  };
}

// ---- primitivos de card ----
export const cardStyle: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusCard,
};

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

// ---- avatar quadrado com inicial ----
export function Avatar({
  letter,
  bg = "#f1f0f8",
  color = T.primary,
  size = 30,
  radius = 9,
  font = 12,
}: {
  letter: string;
  bg?: string;
  color?: string;
  size?: number;
  radius?: number;
  font?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: font,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

// ---- chip de filtro (Todas/Ativas/…) ----
export function Chip({
  label,
  n,
  active,
  onClick,
}: {
  label: string;
  n: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: active ? T.primary : "#fff",
        border: `1px solid ${active ? T.primary : T.border}`,
        borderRadius: 11,
        padding: "0 14px",
        height: 40,
        fontSize: 13,
        fontWeight: 700,
        color: active ? "#fff" : T.body,
        cursor: "pointer",
      }}
    >
      {label}{" "}
      <span style={{ color: active ? "rgba(255,255,255,.7)" : T.faint, fontWeight: 600 }}>{n}</span>
    </div>
  );
}

// ---- caixa de busca (controlada) ----
export function SearchBox({
  value,
  onChange,
  placeholder,
  width = 240,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  width?: number;
}) {
  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 9,
        height: 40,
        background: "#fff",
        border: `1px solid ${T.border}`,
        borderRadius: 11,
        padding: "0 14px",
        width,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 13,
          color: "#333",
          width: "100%",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// ---- KPI simples (telas Assinaturas/Clientes/Cadastros) ----
export function KpiCard({
  label,
  value,
  valueColor,
  delta,
  deltaColor,
  gradient,
}: {
  label: string;
  value: string;
  valueColor?: string;
  delta?: string;
  deltaColor?: string;
  gradient?: boolean;
}) {
  return (
    <div
      style={{
        background: gradient ? "linear-gradient(135deg,#6d5cf5,#8b6bff)" : T.card,
        border: gradient ? "none" : `1px solid ${T.border}`,
        borderRadius: T.radiusKpi,
        padding: "16px 18px",
        color: gradient ? "#fff" : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: gradient ? undefined : T.muted, opacity: gradient ? 0.85 : 1, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: valueColor }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2, color: gradient ? undefined : deltaColor, opacity: gradient ? 0.9 : 1 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ---- primitivos de tabela ----
export const tableHeadStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: T.faint,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  borderBottom: `1px solid ${T.line}`,
};
