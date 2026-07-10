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
