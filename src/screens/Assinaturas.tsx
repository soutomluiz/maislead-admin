import { T } from "../theme";
import { Card, Chip, EmptyState, KpiCard, SearchBox, SoonBadge, tableHeadStyle } from "../lib/ui";
import type { Sub } from "../data/mock";

export type SubFilter = "todas" | "ativas" | "trial" | "inad";
const grid = "2fr 1fr 1fr 1fr 1fr 1fr";

// Billing (Stripe) ainda não está conectado a este painel — sem assinaturas reais.
// Assim que o webhook do Stripe gravar as assinaturas, esta lista passa a ler do banco.
const subs: Sub[] = [];

export function Assinaturas({
  filter,
  setFilter,
  query,
  setQuery,
  onOpen,
}: {
  filter: SubFilter;
  setFilter: (f: SubFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  onOpen: (s: Sub) => void;
}) {
  void onOpen; // sem linhas para abrir enquanto o billing não conecta
  return (
    <div className="screen">
      {/* KPIs — zerados até o billing conectar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="MRR de assinaturas" value="R$ 0" delta="requer Stripe" deltaColor={T.muted} />
        <KpiCard label="Novas no mês" value="0" delta="—" deltaColor={T.muted} />
        <KpiCard label="Canceladas no mês" value="0" delta="—" deltaColor={T.muted} />
        <KpiCard label="Trials terminando" value="0" delta="próximos 7 dias" deltaColor={T.muted} />
      </div>

      {/* chips + busca */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Chip label="Todas" n={0} active={filter === "todas"} onClick={() => setFilter("todas")} />
        <Chip label="Ativas" n={0} active={filter === "ativas"} onClick={() => setFilter("ativas")} />
        <Chip label="Trial" n={0} active={filter === "trial"} onClick={() => setFilter("trial")} />
        <Chip label="Inadimplentes" n={0} active={filter === "inad"} onClick={() => setFilter("inad")} />
        <SearchBox value={query} onChange={setQuery} placeholder="Filtrar assinaturas…" />
      </div>

      {/* tabela / estado vazio */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 22px", ...tableHeadStyle, borderBottom: `1px solid ${T.line}` }}>
          <span style={{ display: "grid", gridTemplateColumns: grid, gap: 8, flex: 1 }}>
            <span>Cliente</span><span>Plano</span><span>Status</span><span>MRR</span><span>Ciclo</span><span>Próx. cobrança</span>
          </span>
          <SoonBadge />
        </div>
        {subs.length === 0 ? (
          <EmptyState
            title="Nenhuma assinatura ainda"
            hint="As assinaturas aparecem aqui quando o billing (Stripe) estiver conectado e um cliente assinar um plano pago. Contas de cortesia/teste ficam na aba Clientes."
          />
        ) : null}
      </Card>
    </div>
  );
}
