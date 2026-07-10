import { T } from "../theme";
import { Avatar, Card, KpiCard, Pill, tableHeadStyle } from "../lib/ui";
import type { RealCustomer } from "../lib/api";

const grid = "2fr 1fr 1fr 1fr 1fr";

function ddmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Cadastros({ customers, loading, error }: { customers: RealCustomer[]; loading: boolean; error: string | null }) {
  const now = new Date();
  const thisMonth = customers.filter((c) => {
    const d = new Date(c.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const trialNow = customers.filter((c) => c.status === "trial").length;
  const recent = [...customers].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 10);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Cadastros no mês" value={loading ? "…" : String(thisMonth.length)} />
        <KpiCard label="Em trial agora" value={loading ? "…" : String(trialNow)} delta="contas em avaliação" deltaColor={T.amberD} />
        <KpiCard label="Trial → pago" value="—" delta="depende do Stripe" deltaColor={T.muted} />
      </div>

      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Cadastros recentes</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "12px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Origem</span><span>Plano</span><span>Data</span><span>Status</span>
        </div>

        {loading && <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>Carregando cadastros…</div>}
        {error && !loading && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.redD, fontSize: 13 }}>
            {error === "not_admin" ? "Acesso restrito a superadmin." : `Erro ao carregar: ${error}`}
          </div>
        )}

        {!loading && !error && recent.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "13px 22px", alignItems: "center", fontSize: 13, borderBottom: `1px solid ${T.line2}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar letter={c.i} />
              <div><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: T.faint }}>{c.email}</div></div>
            </div>
            <span style={{ color: T.body }}>—</span>
            <span style={{ fontWeight: 700, color: T.primary2 }}>{c.plan}</span>
            <span style={{ color: T.body }}>{ddmm(c.createdAt)}</span>
            <span><Pill kind={c.status === "trial" ? "emtrial" : "convertido"} /></span>
          </div>
        ))}

        {!loading && !error && recent.length === 0 && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>Nenhum cadastro ainda.</div>
        )}
      </Card>
    </div>
  );
}
