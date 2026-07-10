import { T } from "../theme";
import { Avatar, Card, KpiCard, Pill, tableHeadStyle } from "../lib/ui";
import { costs, dunning, payments } from "../data/mock";

const payGrid = "2fr 1fr 1fr 1fr 1fr";

export function Financeiro() {
  return (
    <div>
      {/* resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Receita bruta (mês)" value="R$ 63,5k" delta="▲ 12,4% vs junho" gradient />
        <KpiCard label="Custos fixos (mês)" value="R$ 18,7k" delta="manutenção do CRM" deltaColor={T.muted} />
        <KpiCard label="Margem líquida" value="R$ 44,8k" valueColor={T.greenD} delta="70,6% de margem" deltaColor={T.greenD} />
        <KpiCard label="A receber" value="R$ 12,3k" delta="6 cobranças pendentes" deltaColor={T.amberD} />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {/* custos fixos */}
        <Card style={{ flex: 1.3, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Custos fixos da plataforma</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>O que é pago todo mês para manter o CRM no ar</div>
          </div>
          {costs.map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderBottom: `1px solid ${T.line2}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 15 }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.cat}</div>
              </div>
              <div style={{ width: 90, flexShrink: 0 }}>
                <div style={{ height: 6, background: T.line, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: c.pct, height: "100%", background: T.primary }} />
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, width: 72, textAlign: "right" }}>{c.val}</div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 22px", background: T.hover }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.body }}>Total de custos fixos</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>R$ 18.680</span>
          </div>
        </Card>

        {/* receita vs custo */}
        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Receita vs. custo</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Distribuição do mês</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 128, height: 128, borderRadius: "50%", background: "conic-gradient(#10b981 0 70.6%,#f43f5e 70.6% 100%)", position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: 19, background: "#fff", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.greenD }}>70,6%</div>
                <div style={{ fontSize: 10.5, color: T.muted }}>margem</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: T.green }} /><span style={{ fontSize: 13, fontWeight: 700 }}>Lucro</span></div>
                <div style={{ fontSize: 13, color: T.muted, marginLeft: 19 }}>R$ 44,8k</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: T.red }} /><span style={{ fontSize: 13, fontWeight: 700 }}>Custos</span></div>
                <div style={{ fontSize: 13, color: T.muted, marginLeft: 19 }}>R$ 18,7k</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* pagamentos */}
      <Card style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Pagamentos de clientes</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Entradas recentes via Stripe</div>
          </div>
          <span style={{ fontSize: 12.5, color: T.primary, fontWeight: 700, cursor: "pointer" }}>Exportar CSV →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: payGrid, gap: 8, padding: "12px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Valor</span><span>Método</span><span>Data</span><span>Status</span>
        </div>
        {payments.map((p) => (
          <div key={p.i + p.name} style={{ display: "grid", gridTemplateColumns: payGrid, gap: 8, padding: "13px 22px", alignItems: "center", fontSize: 13, borderBottom: `1px solid ${T.line2}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar letter={p.i} />
              <div><div style={{ fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: T.faint }}>{p.plan}</div></div>
            </div>
            <span style={{ fontWeight: 800 }}>{p.val}</span>
            <span style={{ color: T.body }}>{p.method}</span>
            <span style={{ color: T.body }}>{p.date}</span>
            <span><Pill kind={p.status} /></span>
          </div>
        ))}
      </Card>

      {/* dunning */}
      <div style={{ background: "#fff", border: "1px solid #f3d9a4", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: "1px solid #faf0d8", background: "#fffcf4" }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(245,158,11,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.4">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Cobranças com falha (dunning)</div>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.amberD, fontWeight: 700 }}>R$ 4.290 em risco</span>
        </div>
        {dunning.map((d, idx) => (
          <div key={d.i + d.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", fontSize: 13, borderBottom: idx === dunning.length - 1 ? "none" : `1px solid ${T.line2}` }}>
            <Avatar letter={d.i} bg={d.bg} color={d.color} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{d.name}</div><div style={{ fontSize: 11, color: T.faint }}>{d.reason}</div></div>
            <span style={{ fontWeight: 800, marginRight: 14 }}>{d.val}</span>
            <span style={{ fontSize: 11, color: d.attemptColor, fontWeight: 700, marginRight: 14 }}>{d.attempt}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, cursor: "pointer", background: "rgba(109,92,245,.1)", padding: "6px 12px", borderRadius: 9 }}>Reprocessar</span>
          </div>
        ))}
      </div>
    </div>
  );
}
