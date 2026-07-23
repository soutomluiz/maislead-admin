import { T } from "../theme";
import type { IntegrationHealth } from "../lib/api";

export function Integracoes({ data, loading, error }: { data: IntegrationHealth[]; loading: boolean; error: string | null }) {
  if (loading) return <div style={{ padding: "40px 0", textAlign: "center", color: T.faint, fontSize: 13 }}>Verificando serviços…</div>;
  if (error)
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: T.redD, fontSize: 13 }}>
        {error === "not_admin" ? "Acesso restrito a superadmin." : `Erro ao verificar: ${error}`}
      </div>
    );

  return (
    <div className="screen" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
      {data.map((it) => (
        <div
          key={it.name}
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: it.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 19 }}>
            {it.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{it.name}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{it.desc}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: it.dot }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: it.statusCol }}>{it.status}</span>
            </div>
            <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>{it.info}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
