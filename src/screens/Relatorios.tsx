import { T } from "../theme";
import { Card, EmptyState, SoonBadge } from "../lib/ui";
import type { RealCustomer } from "../lib/api";

export type Period = "7d" | "30d" | "90d" | "12m";
const PERIODS: [Period, string][] = [
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["90d", "90 dias"],
  ["12m", "12 meses"],
];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const PLAN_COLORS: Record<string, string> = { Business: "#4c2ee0", Pro: "#6d4bff", Starter: "#c9b8ff" };

function exportCsv(customers: RealCustomer[]) {
  const headers = ["Conta", "Email", "Plano", "Status", "Leads", "Buscas", "Saude", "Ult atividade", "Criada"];
  const rows = customers.map((c) => [c.name, c.email, c.plan, c.status, c.leads, c.searches, c.health, c.lastActive, c.createdAt]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "maislead-contas.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Relatorios({
  period,
  setPeriod,
  customers,
  loading,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
  customers: RealCustomer[];
  loading: boolean;
}) {
  // crescimento de contas — cumulativo nos últimos 7 meses (real)
  const now = new Date();
  const growth = Array.from({ length: 7 }, (_, k) => {
    const i = 6 - k;
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const cum = customers.filter((c) => new Date(c.createdAt) <= end).length;
    return { label: MONTHS[end.getMonth()], cum };
  });
  const maxCum = Math.max(1, ...growth.map((g) => g.cum));
  const pts = growth.map((g, idx) => {
    const x = (idx / 6) * 640;
    const y = 190 - (g.cum / maxCum) * 150;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ");
  const area = `${line} L640,200 L0,200 Z`;

  // contas por plano — real
  const planCount = (plan: string) => customers.filter((c) => c.plan === plan).length;
  const byPlan = [
    { name: "Business", n: planCount("Business") },
    { name: "Pro", n: planCount("Pro") },
    { name: "Starter", n: planCount("Starter") },
  ];
  const maxPlan = Math.max(1, ...byPlan.map((b) => b.n));

  return (
    <div className="screen">
      {/* barra de período + export */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: 4 }}>
          {PERIODS.map(([p, label]) => (
            <span
              key={p}
              onClick={() => setPeriod(p)}
              className="ml-press"
              style={{ fontSize: 12.5, fontWeight: 700, padding: "7px 14px", borderRadius: 9, cursor: "pointer", background: period === p ? T.primary : "transparent", color: period === p ? "#fff" : T.muted }}
            >
              {label}
            </span>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span
            onClick={() => exportCsv(customers)}
            className="ml-press ml-btn-primary"
            style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", background: T.primary, padding: "9px 14px", borderRadius: 10, cursor: "pointer" }}
          >
            Exportar CSV
          </span>
        </div>
      </div>

      {/* crescimento de contas + contas por plano */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1.5, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Crescimento de contas</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Total acumulado de contas ao longo do tempo</div>
          <svg viewBox="0 0 640 200" style={{ width: "100%", height: 190 }}>
            <defs>
              <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4c2ee0" stopOpacity=".26" />
                <stop offset="1" stopColor="#4c2ee0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#gr)" />
            <path d={line} fill="none" stroke="#4c2ee0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="5" fill="#4c2ee0" stroke="#fff" strokeWidth="2.5" />
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.faint, fontWeight: 600 }}>
            {growth.map((g, i) => <span key={i}>{g.label}</span>)}
          </div>
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Contas por plano</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {byPlan.map((b) => (
              <div key={b.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{b.name}</span>
                  <span style={{ color: T.muted, fontWeight: 700 }}>{b.n}</span>
                </div>
                <div style={{ height: 11, background: T.line, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((b.n / maxPlan) * 100)}%`, height: "100%", background: PLAN_COLORS[b.name] }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.body }}>Total de contas</span>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{loading ? "…" : customers.length}</span>
          </div>
        </Card>
      </div>

      {/* cohort — pendente do Stripe (histórico de assinatura) */}
      <Card style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Retenção por cohort</div>
          <SoonBadge text="Requer Stripe" />
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Quanto de cada safra de clientes continua ativa mês a mês</div>
        <EmptyState
          title="Sem histórico de assinatura ainda"
          hint="A retenção por cohort é montada a partir do histórico de cobranças do Stripe. Assim que o billing estiver conectado e houver alguns meses de dados, o mapa de calor aparece aqui."
        />
      </Card>
    </div>
  );
}
