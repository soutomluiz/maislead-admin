import { T } from "../theme";
import { Avatar, Card, KpiCard, Pill, tableHeadStyle } from "../lib/ui";
import { signups } from "../data/mock";

const grid = "2fr 1fr 1fr 1fr 1fr";

export function Cadastros() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Cadastros no mês" value="87" delta="▲ +9 vs junho" deltaColor={T.greenD} />
        <KpiCard label="Em trial agora" value="8" delta="4 expiram esta semana" deltaColor={T.amberD} />
        <KpiCard label="Trial → pago" value="38%" delta="acima da meta (30%)" deltaColor={T.greenD} />
      </div>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Cadastros recentes</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "12px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Origem</span><span>Plano</span><span>Data</span><span>Status</span>
        </div>
        {signups.map((s) => (
          <div key={s.i + s.name} style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "13px 22px", alignItems: "center", fontSize: 13, borderBottom: `1px solid ${T.line2}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar letter={s.i} />
              <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 11, color: T.faint }}>{s.email}</div></div>
            </div>
            <span style={{ color: T.body }}>{s.origin}</span>
            <span style={{ fontWeight: 700, color: T.primary2 }}>{s.plan}</span>
            <span style={{ color: T.body }}>{s.date}</span>
            <span><Pill kind={s.status} /></span>
          </div>
        ))}
      </Card>
    </div>
  );
}
