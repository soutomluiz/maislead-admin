import { T } from "../theme";
import { Card, cohortShade } from "../lib/ui";
import { cohortRaw, revenueByPlan } from "../data/mock";

export type Period = "7d" | "30d" | "90d" | "12m";
const PERIODS: [Period, string][] = [
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["90d", "90 dias"],
  ["12m", "12 meses"],
];

export function Relatorios({ period, setPeriod }: { period: Period; setPeriod: (p: Period) => void }) {
  return (
    <div>
      {/* barra de período + export */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 4 }}>
          {PERIODS.map(([p, label]) => (
            <span
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                padding: "7px 14px",
                borderRadius: 9,
                cursor: "pointer",
                background: period === p ? T.primary : "transparent",
                color: period === p ? "#fff" : T.muted,
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: T.primary, background: "rgba(109,92,245,.1)", padding: "9px 14px", borderRadius: 10, cursor: "pointer" }}>Exportar PDF</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", background: T.primary, padding: "9px 14px", borderRadius: 10, cursor: "pointer" }}>Exportar CSV</span>
        </div>
      </div>

      {/* crescimento + receita por plano */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1.5, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Crescimento de assinantes</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Base líquida ao longo do tempo</div>
          <svg viewBox="0 0 640 200" style={{ width: "100%", height: 190 }}>
            <defs>
              <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6d5cf5" stopOpacity=".26" />
                <stop offset="1" stopColor="#6d5cf5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,168 L106,158 L212,150 L318,150 L424,116 L530,86 L640,50 L640,200 L0,200 Z" fill="url(#gr)" />
            <path d="M0,168 L106,158 L212,150 L318,150 L424,116 L530,86 L640,50" fill="none" stroke="#6d5cf5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="640" cy="50" r="5" fill="#6d5cf5" stroke="#fff" strokeWidth="2.5" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.faint, fontWeight: 600 }}>
            {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Receita por plano</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {revenueByPlan.map((r) => (
              <div key={r.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{r.name}</span>
                  <span style={{ color: T.muted, fontWeight: 700 }}>{r.val}</span>
                </div>
                <div style={{ height: 11, background: T.line, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${r.pct}%`, height: "100%", background: r.color }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.body }}>Total MRR</span>
            <span style={{ fontSize: 15, fontWeight: 800 }}>R$ 48,2k</span>
          </div>
        </Card>
      </div>

      {/* cohort */}
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Retenção por cohort</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>
          % de clientes ainda ativos, por mês de entrada — quanto mais escuro, melhor a retenção
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "90px repeat(6,1fr)", gap: 6, alignItems: "center" }}>
          <div />
          {["Mês 0", "Mês 1", "Mês 2", "Mês 3", "Mês 4", "Mês 5"].map((m) => (
            <div key={m} style={{ fontSize: 11, color: T.faint, fontWeight: 700, textAlign: "center" }}>{m}</div>
          ))}
          {cohortRaw.map((row) => (
            <Row key={row.label} label={row.label} cells={row.cells} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: (number | null)[] }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.body }}>{label}</div>
      {cells.map((v, i) => {
        const c = cohortShade(v);
        return (
          <div key={i} style={{ height: 38, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, background: c.bg, color: c.col }}>
            {c.v}
          </div>
        );
      })}
    </>
  );
}
