import type { ReactNode } from "react";
import { T, type Screen } from "../theme";

const ICONS: Record<Screen, ReactNode> = {
  visao: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  assinaturas: (
    <>
      <path d="M20 12V8H6a2 2 0 010-4h12v4" />
      <path d="M4 6v12a2 2 0 002 2h14v-4" />
      <circle cx="16" cy="14" r="1.5" />
    </>
  ),
  clientes: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
    </>
  ),
  financeiro: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </>
  ),
  cadastros: (
    <>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </>
  ),
  relatorios: (
    <>
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="6" rx="1" />
      <rect x="12" y="7" width="3" height="10" rx="1" />
      <rect x="17" y="9" width="3" height="8" rx="1" />
    </>
  ),
  integracoes: (
    <>
      <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" />
      <path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />
    </>
  ),
};

const GESTAO: [Screen, string][] = [
  ["visao", "Visão Geral"],
  ["assinaturas", "Assinaturas"],
  ["clientes", "Clientes"],
  ["financeiro", "Financeiro"],
  ["cadastros", "Cadastros"],
  ["relatorios", "Relatórios"],
];

function NavItem({
  active,
  label,
  icon,
  dot,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 12px",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: 13.5,
        marginBottom: 2,
        background: active ? "rgba(76,46,224,.1)" : "transparent",
        color: active ? T.primary : T.body,
        fontWeight: active ? 700 : 500,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icon}
      </svg>
      {label}
      {dot && (
        <span
          style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: T.amber }}
        />
      )}
    </div>
  );
}

const groupLabel = (extraTop = false): React.CSSProperties => ({
  fontSize: 10.5,
  fontWeight: 700,
  color: T.section,
  letterSpacing: ".1em",
  padding: extraTop ? "14px 10px 6px" : "6px 10px",
});

export function Sidebar({
  screen,
  onNavigate,
  onLogout,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
}) {
  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: T.card,
        borderRight: `1px solid ${T.border}`,
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: T.gradLogo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 17,
          }}
        >
          m
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>maisLEAD</div>
          <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 700, letterSpacing: ".08em" }}>
            SUPERADMIN
          </div>
        </div>
      </div>

      <div style={groupLabel()}>GESTÃO</div>
      {GESTAO.map(([key, label]) => (
        <NavItem
          key={key}
          active={screen === key}
          label={label}
          icon={ICONS[key]}
          onClick={() => onNavigate(key)}
        />
      ))}

      <div style={groupLabel(true)}>PLATAFORMA</div>
      <NavItem
        active={screen === "integracoes"}
        label="Integrações"
        icon={ICONS.integracoes}
        dot
        onClick={() => onNavigate("integracoes")}
      />

      {/* rodapé — usuário */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: 10,
          borderRadius: 14,
          background: T.band,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg,#211d3b,#4a4568)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          A
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Você (Admin)</div>
          <div style={{ fontSize: 11, color: T.muted }}>Superadmin</div>
        </div>
        <div
          onClick={onLogout}
          title="Sair"
          style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.muted }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </div>
      </div>
    </aside>
  );
}
