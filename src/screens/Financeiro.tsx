import { T } from "../theme";
import { Card, EmptyState, KpiCard, SoonBadge } from "../lib/ui";

// Financeiro depende do billing (Stripe) e de um registro de custos — nada disso
// está conectado ainda, então mostramos estados vazios honestos (nunca números fictícios).

export function Financeiro() {
  return (
    <div className="screen">
      {/* resumo — zerado até o billing conectar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Receita bruta (mês)" value="R$ 0" delta="requer Stripe" deltaColor={T.muted} />
        <KpiCard label="Custos fixos (mês)" value="R$ 0" delta="sem custos cadastrados" deltaColor={T.muted} />
        <KpiCard label="Margem líquida" value="R$ 0" delta="—" deltaColor={T.muted} />
        <KpiCard label="A receber" value="R$ 0" delta="—" deltaColor={T.muted} />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {/* custos fixos */}
        <Card style={{ flex: 1.3, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Custos fixos da plataforma</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>O que é pago todo mês para manter o CRM no ar</div>
            </div>
          </div>
          <EmptyState
            title="Nenhum custo cadastrado"
            hint="Quando você registrar os custos mensais da plataforma (infra, APIs, ferramentas), eles aparecem aqui com o total."
          />
        </Card>

        {/* receita vs custo */}
        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Receita vs. custo</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Distribuição do mês</div>
          <EmptyState title="Sem dados financeiros" hint="Precisa de receita (Stripe) e custos cadastrados." compact />
        </Card>
      </div>

      {/* pagamentos */}
      <Card style={{ overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Pagamentos de clientes</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Entradas recentes via Stripe</div>
          </div>
          <SoonBadge />
        </div>
        <EmptyState
          title="Nenhum pagamento ainda"
          hint="Os pagamentos aparecem aqui automaticamente quando o webhook do Stripe estiver conectado e um cliente for cobrado."
        />
      </Card>

      {/* dunning */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(245,158,11,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.4">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Cobranças com falha (dunning)</div>
          <span style={{ marginLeft: "auto" }}><SoonBadge /></span>
        </div>
        <EmptyState title="Nenhuma cobrança com falha" hint="Cartões recusados e retentativas aparecem aqui quando o billing estiver ativo." />
      </Card>
    </div>
  );
}
