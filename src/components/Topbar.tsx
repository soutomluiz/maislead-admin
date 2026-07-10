import { T } from "../theme";

export function Topbar({
  title,
  subtitle,
  search,
  onSearch,
}: {
  title: string;
  subtitle: string;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <header
      style={{
        height: 70,
        flexShrink: 0,
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 26px",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.muted }}>{subtitle}</div>
      </div>

      {/* badge Ao vivo */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(16,185,129,.1)",
          padding: "7px 12px",
          borderRadius: 20,
        }}
        title="Dados atualizados automaticamente"
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "livedot 2s infinite" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.greenD }}>Ao vivo</span>
      </div>

      {/* busca (funcional) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          height: 40,
          background: T.band,
          borderRadius: 12,
          padding: "0 14px",
          width: 220,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar cliente…"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: T.text, width: "100%", fontFamily: "inherit" }}
        />
      </div>
    </header>
  );
}
