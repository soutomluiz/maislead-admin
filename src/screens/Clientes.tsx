import { T } from "../theme";
import { Avatar, Card, Chip, KpiCard, Pill, SearchBox, healthColor, tableHeadStyle } from "../lib/ui";
import { clientsRaw, segments, topClients, type Client, type CliStatus } from "../data/mock";

export type CliFilter = "todos" | "ativos" | "trial" | "ociosos";
const STATUS_MAP: Record<CliFilter, CliStatus | null> = { todos: null, ativos: "ativo", trial: "trial", ociosos: "ocioso" };
const grid = "2.2fr 1fr 1fr 1fr 1.1fr 1fr";

export function Clientes({
  filter,
  setFilter,
  query,
  setQuery,
  onOpen,
}: {
  filter: CliFilter;
  setFilter: (f: CliFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  onOpen: (c: Client) => void;
}) {
  const q = query.toLowerCase();
  const rows = clientsRaw
    .filter((c) => (STATUS_MAP[filter] ? c.status === STATUS_MAP[filter] : true))
    .filter((c) => (q ? c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) : true));
  const count = (st: CliStatus) => clientsRaw.filter((c) => c.status === st).length;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Total de clientes" value="429" />
        <KpiCard label="Ativos (últimos 30d)" value="318" delta="74% da base" deltaColor={T.greenD} />
        <KpiCard label="Ociosos (risco)" value="24" valueColor={T.amberD} delta="abordar" deltaColor={T.amberD} />
        <KpiCard label="Ticket médio (ARPA)" value="R$ 141" />
      </div>

      {/* top clientes + segmentação */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>🏆 Top clientes por receita</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Quem mais sustenta o faturamento</div>
          </div>
          {topClients.map((c) => (
            <div key={c.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderBottom: `1px solid ${T.line2}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.lilac, width: 18 }}>{c.rank}</div>
              <Avatar letter={c.i} size={32} font={13} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.faint }}>{c.plan} · cliente há {c.since}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{c.total}</div>
                <div style={{ fontSize: 11, color: T.muted }}>acumulado</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Segmentação por setor</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Onde a maisLEAD mais penetra</div>
          </div>
          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {segments.map((s) => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span style={{ color: T.muted, fontWeight: 700 }}>{s.pct}%</span>
                </div>
                <div style={{ height: 10, background: T.line, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ width: `${s.pct}%`, height: "100%", background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* chips + busca */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <Chip label="Todos" n={clientsRaw.length} active={filter === "todos"} onClick={() => setFilter("todos")} />
        <Chip label="Ativos" n={count("ativo")} active={filter === "ativos"} onClick={() => setFilter("ativos")} />
        <Chip label="Trial" n={count("trial")} active={filter === "trial"} onClick={() => setFilter("trial")} />
        <Chip label="Ociosos" n={count("ocioso")} active={filter === "ociosos"} onClick={() => setFilter("ociosos")} />
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar cliente…" width={260} />
      </div>

      {/* lista */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "13px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Plano</span><span>Status</span><span>Saúde</span><span>Leads gerados</span><span>Últ. atividade</span>
        </div>
        {rows.map((c) => {
          const hc = healthColor(c.health);
          return (
            <div
              key={c.i + c.name}
              onClick={() => onOpen(c)}
              className="ml-row"
              style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "14px 22px", alignItems: "center", fontSize: 13, borderBottom: `1px solid ${T.line2}`, cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar letter={c.i} />
                <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 11, color: T.faint }}>{c.city}</div></div>
              </div>
              <span style={{ fontWeight: 700, color: T.primary2 }}>{c.plan}</span>
              <span><Pill kind={c.status} /></span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, maxWidth: 56, height: 7, background: T.line, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${c.health}%`, height: "100%", background: hc }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: hc }}>{c.health}</span>
              </div>
              <span style={{ fontWeight: 700 }}>{c.leads}</span>
              <span style={{ color: T.body, fontSize: 12.5 }}>{c.lastActive}</span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>
            Nenhum cliente encontrado com esse filtro.
          </div>
        )}
      </Card>
    </div>
  );
}
