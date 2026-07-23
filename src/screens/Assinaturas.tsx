import { T } from "../theme";
import { Avatar, Card, Chip, KpiCard, Pill, SearchBox, tableHeadStyle } from "../lib/ui";
import { subsRaw, type Sub, type SubStatus } from "../data/mock";

export type SubFilter = "todas" | "ativas" | "trial" | "inad";
const STATUS_MAP: Record<SubFilter, SubStatus | null> = { todas: null, ativas: "ativo", trial: "trial", inad: "inad" };
const grid = "2fr 1fr 1fr 1fr 1fr 1fr";

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
  const q = query.toLowerCase();
  const rows = subsRaw
    .filter((s) => (STATUS_MAP[filter] ? s.status === STATUS_MAP[filter] : true))
    .filter((s) => (q ? s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q) : true));

  const count = (st: SubStatus) => subsRaw.filter((s) => s.status === st).length;

  return (
    <div className="screen">
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="MRR de assinaturas" value="R$ 48,2k" delta="▲ 12,4% vs junho" deltaColor={T.greenD} />
        <KpiCard label="Novas no mês" value="+24" delta="R$ 4,8k em novo MRR" deltaColor={T.greenD} />
        <KpiCard label="Canceladas no mês" value="7" valueColor={T.redD} delta="churn 2,1%" deltaColor={T.redD} />
        <KpiCard label="Trials terminando" value="8" valueColor={T.amberD} delta="próximos 7 dias" deltaColor={T.amberD} />
      </div>

      {/* chips + busca */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Chip label="Todas" n={subsRaw.length} active={filter === "todas"} onClick={() => setFilter("todas")} />
        <Chip label="Ativas" n={count("ativo")} active={filter === "ativas"} onClick={() => setFilter("ativas")} />
        <Chip label="Trial" n={count("trial")} active={filter === "trial"} onClick={() => setFilter("trial")} />
        <Chip label="Inadimplentes" n={count("inad")} active={filter === "inad"} onClick={() => setFilter("inad")} />
        <SearchBox value={query} onChange={setQuery} placeholder="Filtrar assinaturas…" />
      </div>

      {/* tabela */}
      <Card className="rows" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "13px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Plano</span><span>Status</span><span>MRR</span><span>Ciclo</span><span>Próx. cobrança</span>
        </div>
        {rows.map((s) => (
          <div
            key={s.i + s.name}
            onClick={() => onOpen(s)}
            className="ml-row"
            style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "14px 22px", alignItems: "center", fontSize: 13, borderBottom: `1px solid ${T.line2}`, cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar letter={s.i} />
              <div><div style={{ fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 11, color: T.faint }}>{s.city}</div></div>
            </div>
            <span style={{ fontWeight: 700, color: T.primary2 }}>{s.plan}</span>
            <span><Pill kind={s.status} /></span>
            <span style={{ fontWeight: 700 }}>{s.mrr}</span>
            <span style={{ color: T.body }}>{s.cycle}</span>
            <span style={{ color: T.body }}>{s.next}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>
            Nenhuma assinatura encontrada com esse filtro.
          </div>
        )}
      </Card>
    </div>
  );
}
