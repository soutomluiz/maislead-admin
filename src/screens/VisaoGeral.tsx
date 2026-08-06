import type { CSSProperties, ReactNode } from "react";
import { T, type Screen } from "../theme";
import { Card, Pill, EmptyState, SoonBadge } from "../lib/ui";
import type { RealCustomer } from "../lib/api";

/* ---------- helpers locais ---------- */
function Kpi({
  label,
  value,
  delta,
  deltaColor = T.greenD,
  pending,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: string;
  pending?: boolean;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusKpi,
        padding: "15px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{label}</span>
        {pending && <SoonBadge />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginTop: 8 }}>{value}</div>
      {delta && <div style={{ fontSize: 11, fontWeight: 700, color: deltaColor, marginTop: 3 }}>{delta}</div>}
    </div>
  );
}

function Avatar({ letter, bg, color, size = 30 }: { letter: string; bg: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

const sectionTitle: CSSProperties = { fontSize: 15, fontWeight: 800 };

/* ---------- tela ---------- */
export interface IdleItem {
  i: string;
  name: string;
  sub: string;
  days: string;
}

export interface OverviewCounts {
  total: number;
  ativo: number;
  trial: number;
  ocioso: number;
  leadsProcessed: number;
}

const IDLE_PALETTE = [
  { bg: "#e9e5ff", color: T.primary },
  { bg: "#fde8f0", color: T.avatarPink },
  { bg: "#fef0e6", color: T.avatarOrange },
];

const AVA_PALETTE = [
  { bg: "#fef0e6", color: T.avatarOrange },
  { bg: "#e9e5ff", color: T.primary },
  { bg: "#fde8f0", color: T.avatarPink },
];

// Preço mensal por plano (mesma tabela da edge function) — usado só pra rótulos.
const PLAN_COLORS: Record<string, string> = { Business: T.primary, Pro: T.primary4, Starter: T.lilac };
const money = (n: number) => "R$ " + n.toLocaleString("pt-BR");
// "R$ 1.234" → 1234 (o MRR já vem calculado real por conta na edge function)
const parseMrr = (s: string) => Number(String(s).replace(/[^\d]/g, "")) || 0;

export function VisaoGeral({
  onNavigate,
  customers,
  counts,
  leadsProcessed,
  idle,
}: {
  onNavigate: (s: Screen) => void;
  customers: RealCustomer[];
  counts: OverviewCounts | null;
  leadsProcessed?: number | null;
  idle?: IdleItem[];
}) {
  const idleRows = idle ?? [];
  const total = counts?.total ?? 0;
  const ativo = counts?.ativo ?? 0;
  const trial = counts?.trial ?? 0;
  const ocioso = counts?.ocioso ?? 0;
  const leadsValue = leadsProcessed != null ? leadsProcessed.toLocaleString("pt-BR") : "0";

  // MRR real = soma do mrr de cada conta (contas manuais/trial/free já vêm com 0)
  const totalMrr = customers.reduce((s, c) => s + parseMrr(c.mrr), 0);

  // MRR por plano (só contas pagantes: sem kind e fora de trial)
  const mrrByPlan = ["Business", "Pro", "Starter"].map((name) => {
    const accs = customers.filter((c) => c.plan === name && c.kind === null && c.status !== "trial");
    return { name, color: PLAN_COLORS[name], n: accs.length, mrr: accs.reduce((s, c) => s + parseMrr(c.mrr), 0) };
  });
  const maxPlanMrr = Math.max(1, ...mrrByPlan.map((p) => p.mrr));

  // Distribuição de TODAS as contas por plano (donut)
  const dist = [
    { name: "Business", color: T.primary, n: customers.filter((c) => c.plan === "Business").length },
    { name: "Pro", color: T.primary4, n: customers.filter((c) => c.plan === "Pro").length },
    { name: "Starter", color: T.lilac, n: customers.filter((c) => c.plan === "Starter").length },
    { name: "Free / outros", color: "#dcd8ec", n: customers.filter((c) => !["Business", "Pro", "Starter"].includes(c.plan)).length },
  ].filter((d) => d.n > 0);
  let acc = 0;
  const donutStops = dist
    .map((d) => {
      const start = (acc / Math.max(1, total)) * 100;
      acc += d.n;
      const end = (acc / Math.max(1, total)) * 100;
      return `${d.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
    })
    .join(",");
  const donut = total > 0 ? `conic-gradient(${donutStops})` : "#eef";

  // Contas recentes (por data de criação)
  const recent = [...customers]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  // Funil real (contas): total → trial → ativas
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="screen">
      {/* KPIs — todos reais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 13, marginBottom: 16 }}>
        <Kpi label="MRR" value={money(totalMrr)} pending={totalMrr === 0} delta={totalMrr === 0 ? "sem conta pagante" : undefined} deltaColor={T.muted} />
        <Kpi label="Total de contas" value={String(total)} />
        <Kpi label="Ativas" value={String(ativo)} deltaColor={T.greenD} />
        <Kpi label="Em trial" value={String(trial)} deltaColor={T.amberD} />
        <Kpi label="Ociosas" value={String(ocioso)} deltaColor={T.amberD} />
        <Kpi label="Leads processados" value={leadsValue} />
      </div>

      {/* MRR POR PLANO + DONUT */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1.6, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={sectionTitle}>Receita recorrente por plano</div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>MRR atual</div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>Soma das assinaturas pagas ativas, por plano</div>
          {totalMrr > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {mrrByPlan.map((p) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>
                      {p.name} <span style={{ color: T.faint, fontWeight: 600 }}>· {p.n} conta{p.n === 1 ? "" : "s"}</span>
                    </span>
                    <span style={{ color: T.muted, fontWeight: 700 }}>{money(p.mrr)}</span>
                  </div>
                  <div style={{ height: 11, background: T.line, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((p.mrr / maxPlanMrr) * 100)}%`, height: "100%", background: p.color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem receita recorrente ainda"
              hint="As contas atuais são cortesia, trial ou free. Quando um cliente assinar um plano pago (via Stripe), o MRR aparece aqui automaticamente."
            />
          )}
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ ...sectionTitle, marginBottom: 16 }}>Distribuição por plano</div>
          {total > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 128, height: 128, borderRadius: "50%", background: donut, position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: 19, background: "#fff", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 21, fontWeight: 800 }}>{total}</div>
                  <div style={{ fontSize: 10.5, color: T.muted }}>contas</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {dist.map((d) => (
                  <PlanLegend key={d.name} color={d.color} name={d.name} detail={`${d.n} conta${d.n === 1 ? "" : "s"}`} />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="Nenhuma conta ainda" hint="Os planos aparecem aqui conforme os clientes entram." compact />
          )}
        </Card>
      </div>

      {/* OCIOSOS + FUNIL */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(245,158,11,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.4">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div style={sectionTitle}>
              Clientes ociosos <span style={{ color: T.amberD }}>(risco de churn)</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Contas sem uso há +14 dias — abordar antes que cancelem</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {idleRows.map((it, idx) => {
              const pal = IDLE_PALETTE[idx % IDLE_PALETTE.length];
              return <IdleRow key={it.name + idx} letter={it.i} bg={pal.bg} color={pal.color} name={it.name} plan={it.sub} days={it.days} last={idx === idleRows.length - 1} />;
            })}
            {idleRows.length === 0 && <div style={{ fontSize: 12.5, color: T.faint, padding: "14px 0", textAlign: "center" }}>Nenhum cliente ocioso 🎉</div>}
          </div>
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ ...sectionTitle, marginBottom: 4 }}>Funil de contas</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Onde estão as contas hoje</div>
          {total > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <FunnelBar name="Total de contas" right={String(total)} pct={100} color={T.lilac} />
              <FunnelBar name="Em trial" right={`${trial} · ${pct(trial)}%`} pct={pct(trial)} color={T.primary4} />
              <FunnelBar name="Ativas" right={`${ativo} · ${pct(ativo)}%`} pct={pct(ativo)} color={T.primary} />
            </div>
          ) : (
            <EmptyState title="Sem contas para exibir" compact />
          )}
        </Card>
      </div>

      {/* CONTAS RECENTES */}
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${T.line}` }}>
          <div style={sectionTitle}>Contas recentes</div>
          <span onClick={() => onNavigate("clientes")} className="ml-press" style={{ fontSize: 12.5, color: T.primary, fontWeight: 700, cursor: "pointer" }}>
            Ver todas →
          </span>
        </div>
        {recent.length > 0 ? (
          <>
            <div style={{ ...recentGrid, ...recentHead }}>
              <span>Cliente</span>
              <span>Plano</span>
              <span>Status</span>
              <span>MRR</span>
              <span>Criada</span>
              <span>Saúde</span>
            </div>
            {recent.map((c, idx) => {
              const pal = AVA_PALETTE[idx % AVA_PALETTE.length];
              return (
                <RecentRow
                  key={c.id}
                  letter={c.i}
                  abg={pal.bg}
                  acol={pal.color}
                  name={c.name}
                  city={c.city}
                  plan={c.plan}
                  planColor={PLAN_COLORS[c.plan] ?? T.muted}
                  status={<Pill kind={c.status as "ativo" | "trial" | "ocioso"} />}
                  mrr={c.mrr}
                  next={fmtDate(c.createdAt)}
                  use={c.health}
                  last={idx === recent.length - 1}
                />
              );
            })}
          </>
        ) : (
          <EmptyState title="Nenhuma conta ainda" hint="Assim que o primeiro cliente se cadastrar, ele aparece aqui." />
        )}
      </Card>
    </div>
  );
}

/* ---------- subcomponentes ---------- */
function PlanLegend({ color, name, detail }: { color: string; name: string; detail: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{name}</span>
      </div>
      <div style={{ fontSize: 12.5, color: T.muted, marginLeft: 19 }}>{detail}</div>
    </div>
  );
}

function IdleRow({ letter, bg, color, name, plan, days, last }: { letter: string; bg: string; color: string; name: string; plan: string; days: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${T.line2}` }}>
      <Avatar letter={letter} bg={bg} color={color} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 11, color: T.faint }}>{plan}</div>
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: T.amberD, background: "rgba(245,158,11,.12)", padding: "3px 9px", borderRadius: 20 }}>{days}</span>
    </div>
  );
}

function FunnelBar({ name, right, pct, color }: { name: string; right: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 }}>
        <span style={{ fontWeight: 700 }}>{name}</span>
        <span style={{ color: T.muted, fontWeight: 700 }}>{right}</span>
      </div>
      <div style={{ height: 12, background: T.line, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

const recentGrid: CSSProperties = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.1fr", gap: 8 };
const recentHead: CSSProperties = {
  padding: "12px 22px",
  fontSize: 11,
  fontWeight: 700,
  color: T.faint,
  letterSpacing: ".05em",
  textTransform: "uppercase",
  borderBottom: `1px solid ${T.line}`,
};

function RecentRow({
  letter, abg, acol, name, city, plan, planColor, status, mrr, next, use, last,
}: {
  letter: string; abg: string; acol: string; name: string; city: string; plan: string; planColor: string;
  status: ReactNode; mrr: string; next: string; use: number; last?: boolean;
}) {
  const useColor = use >= 70 ? T.greenD : use >= 45 ? T.amberD : T.redD;
  return (
    <div style={{ ...recentGrid, padding: "14px 22px", alignItems: "center", fontSize: 13, borderBottom: last ? "none" : `1px solid ${T.line2}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar letter={letter} bg={abg} color={acol} />
        <div>
          <div style={{ fontWeight: 700 }}>{name}</div>
          <div style={{ fontSize: 11, color: T.faint }}>{city}</div>
        </div>
      </div>
      <span style={{ fontWeight: 700, color: planColor }}>{plan}</span>
      <span>{status}</span>
      <span style={{ fontWeight: 700 }}>{mrr}</span>
      <span style={{ color: T.body }}>{next}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ flex: 1, height: 6, background: T.line, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${use}%`, height: "100%", background: useColor }} />
        </div>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>{use}%</span>
      </div>
    </div>
  );
}
