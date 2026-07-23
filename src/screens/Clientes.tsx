import { T } from "../theme";
import { Avatar, Card, Chip, KpiCard, Pill, SearchBox, healthColor, tableHeadStyle } from "../lib/ui";
import type { CliStatus } from "../data/mock";
import type { RealCustomer } from "../lib/api";

export type CliFilter = "todos" | "ativos" | "trial" | "ociosos";
const STATUS_MAP: Record<CliFilter, CliStatus | null> = { todos: null, ativos: "ativo", trial: "trial", ociosos: "ocioso" };
const grid = "2.2fr 1fr 1fr 1fr 1.1fr 1fr";
const SEG_COLORS = [T.primary, T.primary4, "#b79dff", T.lilac, "#e0d6ff"];

export function Clientes({
  data,
  loading,
  error,
  leadsProcessed,
  filter,
  setFilter,
  query,
  setQuery,
  onOpen,
}: {
  data: RealCustomer[];
  loading: boolean;
  error: string | null;
  leadsProcessed: number | null;
  filter: CliFilter;
  setFilter: (f: CliFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  onOpen: (c: RealCustomer) => void;
}) {
  const q = query.toLowerCase();
  const rows = data
    .filter((c) => (STATUS_MAP[filter] ? c.status === STATUS_MAP[filter] : true))
    .filter((c) => (q ? c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) : true));
  const count = (st: CliStatus) => data.filter((c) => c.status === st).length;

  const total = data.length;
  const active = data.filter((c) => c.status === "ativo").length;
  const idle = data.filter((c) => c.status === "ocioso").length;

  // top clientes por uso (leads gerados) — real
  const topByLeads = [...data].sort((a, b) => b.leads - a.leads).slice(0, 5);

  // segmentação por setor — real (agrupa por industry)
  const segMap = new Map<string, number>();
  for (const c of data) {
    const key = (c.industry || "Não informado").trim() || "Não informado";
    segMap.set(key, (segMap.get(key) ?? 0) + 1);
  }
  const segList = [...segMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const segTotal = data.length || 1;

  return (
    <div className="screen">
      {/* KPIs (reais) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 13, marginBottom: 16 }}>
        <KpiCard label="Total de clientes" value={loading ? "…" : String(total)} />
        <KpiCard label="Ativos (recentes)" value={loading ? "…" : String(active)} delta={total ? `${Math.round((active / total) * 100)}% da base` : "—"} deltaColor={T.greenD} />
        <KpiCard label="Ociosos (risco)" value={loading ? "…" : String(idle)} valueColor={T.amberD} delta="abordar" deltaColor={T.amberD} />
        <KpiCard label="Leads processados" value={loading || leadsProcessed === null ? "…" : leadsProcessed.toLocaleString("pt-BR")} />
      </div>

      {/* top clientes (por uso) + segmentação por setor — reais */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>🏆 Top clientes por uso</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Quem mais gera leads na plataforma</div>
          </div>
          {loading && <div style={{ padding: "26px 22px", color: T.faint, fontSize: 13 }}>Carregando…</div>}
          {!loading && topByLeads.map((c, idx) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderBottom: `1px solid ${T.line2}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.lilac, width: 18 }}>{idx + 1}</div>
              <Avatar letter={c.i} size={32} font={13} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.faint }}>{c.plan} · cliente há {c.since}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{c.leads.toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 11, color: T.muted }}>leads</div>
              </div>
            </div>
          ))}
          {!loading && topByLeads.length === 0 && <div style={{ padding: "26px 22px", color: T.faint, fontSize: 13 }}>Sem dados.</div>}
        </Card>

        <Card style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Segmentação por setor</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Onde a maisLEAD mais penetra</div>
          </div>
          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {loading && <div style={{ color: T.faint, fontSize: 13 }}>Carregando…</div>}
            {!loading && segList.map(([name, n], idx) => {
              const pct = Math.round((n / segTotal) * 100);
              return (
                <div key={name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700 }}>{name}</span>
                    <span style={{ color: T.muted, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 10, background: T.line, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: SEG_COLORS[idx % SEG_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
            {!loading && segList.length === 0 && <div style={{ color: T.faint, fontSize: 13 }}>Sem dados de setor.</div>}
          </div>
        </Card>
      </div>

      {/* chips + busca */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <Chip label="Todos" n={data.length} active={filter === "todos"} onClick={() => setFilter("todos")} />
        <Chip label="Ativos" n={count("ativo")} active={filter === "ativos"} onClick={() => setFilter("ativos")} />
        <Chip label="Trial" n={count("trial")} active={filter === "trial"} onClick={() => setFilter("trial")} />
        <Chip label="Ociosos" n={count("ocioso")} active={filter === "ociosos"} onClick={() => setFilter("ociosos")} />
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar cliente…" width={260} />
      </div>

      {/* lista (real) */}
      <Card className="rows" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, padding: "13px 22px", ...tableHeadStyle }}>
          <span>Cliente</span><span>Plano</span><span>Status</span><span>Saúde</span><span>Leads gerados</span><span>Últ. atividade</span>
        </div>

        {loading && <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>Carregando clientes…</div>}
        {error && !loading && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.redD, fontSize: 13 }}>
            {error === "not_admin" ? "Acesso restrito a superadmin." : `Erro ao carregar: ${error}`}
          </div>
        )}

        {!loading && !error && rows.map((c) => {
          const hc = healthColor(c.health);
          return (
            <div
              key={c.id}
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

        {!loading && !error && rows.length === 0 && (
          <div style={{ padding: "40px 22px", textAlign: "center", color: T.faint, fontSize: 13 }}>
            Nenhum cliente encontrado com esse filtro.
          </div>
        )}
      </Card>
    </div>
  );
}
