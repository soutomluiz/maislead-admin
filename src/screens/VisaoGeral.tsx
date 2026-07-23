import type { CSSProperties, ReactNode } from "react";
import { T, type Screen } from "../theme";
import { Card, Pill } from "../lib/ui";

/* ---------- helpers locais ---------- */
function Kpi({
  label,
  value,
  delta,
  deltaColor = T.greenD,
  venda,
}: {
  label: string;
  value: string;
  delta: string;
  deltaColor?: string;
  venda?: boolean;
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
      {venda ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{label}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: T.primary,
              background: "rgba(76,46,224,.1)",
              padding: "1px 5px",
              borderRadius: 5,
            }}
          >
            VENDA
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 600 }}>{label}</div>
      )}
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginTop: 8 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: deltaColor, marginTop: 3 }}>{delta}</div>
    </div>
  );
}

function Avatar({
  letter,
  bg,
  color,
  size = 30,
}: {
  letter: string;
  bg: string;
  color: string;
  size?: number;
}) {
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

const IDLE_PALETTE = [
  { bg: "#e9e5ff", color: T.primary },
  { bg: "#fde8f0", color: T.avatarPink },
  { bg: "#fef0e6", color: T.avatarOrange },
];

const MOCK_IDLE: IdleItem[] = [
  { i: "M", name: "Mercado Bom Preço", sub: "Business · R$ 349/mês", days: "22 dias" },
  { i: "C", name: "Clínica Vida+", sub: "Pro · R$ 149/mês", days: "18 dias" },
  { i: "T", name: "Transportes Rocha", sub: "Pro · R$ 149/mês", days: "15 dias" },
];

export function VisaoGeral({
  onNavigate,
  leadsProcessed,
  idle,
}: {
  onNavigate: (s: Screen) => void;
  leadsProcessed?: number | null;
  idle?: IdleItem[];
}) {
  const idleRows = idle && idle.length ? idle : MOCK_IDLE;
  const leadsValue = leadsProcessed != null ? leadsProcessed.toLocaleString("pt-BR") : "1,24 mi";
  return (
    <div className="screen">
      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 13,
          marginBottom: 16,
        }}
      >
        <Kpi label="MRR" value="R$ 48,2k" delta="▲ 12,4%" />
        <Kpi label="Assinantes" value="342" delta="▲ +18" />
        <Kpi label="NRR" value="112%" delta="base cresce sozinha" venda />
        <Kpi label="Churn" value="2,1%" delta="▼ 0,3pp" />
        <Kpi label="LTV:CAC" value="4,3x" delta="saudável (>3x)" venda />
        <Kpi label="Leads processados" value={leadsValue} delta="▲ 8,2%" />
      </div>

      {/* WATERFALL + DONUT */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1.6, padding: "20px 22px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <div style={sectionTitle}>Movimento de MRR</div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Julho · em milhares R$</div>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 18 }}>
            De onde veio o crescimento do mês
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 190, padding: "0 4px" }}>
            {/* Base */}
            <div style={colFull}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>42,9</div>
              <div style={{ width: "100%", height: 132, background: T.lilac, borderRadius: "7px 7px 0 0" }} />
              <div style={barLabel}>Base</div>
            </div>
            {/* Novo */}
            <WaterfallMid value="+4,8" valColor={T.greenD} color="#10b981" barH={15} gap={132} label="Novo" />
            {/* Expansão */}
            <WaterfallMid value="+2,1" valColor={T.greenD} color="#34d399" barH={7} gap={147} label="Expansão" />
            {/* Contração */}
            <WaterfallMid value="−0,9" valColor={T.red} color="#fb7185" barH={6} gap={150} label="Contração" />
            {/* Churn */}
            <WaterfallMid value="−0,7" valColor={T.red} color="#f43f5e" barH={5} gap={148} label="Churn" />
            {/* Final */}
            <div style={colFull}>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 6 }}>48,2</div>
              <div
                style={{
                  width: "100%",
                  height: 148,
                  background: "linear-gradient(180deg,#4c2ee0,#6d4bff)",
                  borderRadius: "7px 7px 0 0",
                }}
              />
              <div style={barLabel}>Final</div>
            </div>
          </div>
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ ...sectionTitle, marginBottom: 16 }}>Distribuição por plano</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 128,
                height: 128,
                borderRadius: "50%",
                background: "conic-gradient(#c9b8ff 0 43%,#6d4bff 43% 84%,#4c2ee0 84% 100%)",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 19,
                  background: "#fff",
                  borderRadius: "50%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 21, fontWeight: 800 }}>342</div>
                <div style={{ fontSize: 10.5, color: T.muted }}>ativos</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <PlanLegend color={T.lilac} name="Starter" detail="148 · R$ 7,2k" />
              <PlanLegend color={T.primary4} name="Pro" detail="141 · R$ 21k" />
              <PlanLegend color={T.primary} name="Business" detail="53 · R$ 20k" />
            </div>
          </div>
        </Card>
      </div>

      {/* SALES BAND */}
      <div
        style={{
          borderRadius: 20,
          background: "linear-gradient(120deg,#4c2ee0,#6d4bff 55%,#6d4bff)",
          padding: "22px 26px",
          color: "#fff",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
          }}
        />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Métricas para argumento de venda</div>
        </div>
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: 20,
          }}
        >
          <SaleStat label="NRR" value="112%" sub="retenção líq. receita" />
          <SaleStat label="LTV médio" value="R$ 2,1k" sub="por cliente" />
          <SaleStat label="CAC" value="R$ 486" sub="custo de aquisição" />
          <SaleStat label="LTV:CAC" value="4,3x" sub="meta > 3x ✓" />
          <SaleStat label="Payback" value="3,4 m" sub="p/ recuperar CAC" />
          <SaleStat label="Trial → pago" value="38%" sub="conversão" />
        </div>
      </div>

      {/* IDLE + FUNNEL */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: "rgba(245,158,11,.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
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
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
            Pagantes que não usam há +14 dias — abordar antes que cancelem
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {idleRows.map((it, idx) => {
              const pal = IDLE_PALETTE[idx % IDLE_PALETTE.length];
              return (
                <IdleRow
                  key={it.name + idx}
                  letter={it.i}
                  bg={pal.bg}
                  color={pal.color}
                  name={it.name}
                  plan={it.sub}
                  days={it.days}
                  last={idx === idleRows.length - 1}
                />
              );
            })}
            {idleRows.length === 0 && (
              <div style={{ fontSize: 12.5, color: T.faint, padding: "8px 0" }}>Nenhum cliente ocioso 🎉</div>
            )}
          </div>
        </Card>

        <Card style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ ...sectionTitle, marginBottom: 4 }}>Funil de conversão</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Visitante → trial → pago (últimos 30 dias)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <FunnelBar name="Visitantes" right="8.420" pct={100} color={T.lilac} />
            <FunnelBar name="Cadastros / trial" right="229 · 2,7%" pct={38} color={T.primary4} />
            <FunnelBar name="Assinantes pagos" right="87 · 38%" pct={24} color={T.primary} />
          </div>
        </Card>
      </div>

      {/* RECENT SUBSCRIPTIONS */}
      <Card style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: `1px solid ${T.line}`,
          }}
        >
          <div style={sectionTitle}>Assinaturas recentes</div>
          <span
            onClick={() => onNavigate("assinaturas")}
            className="ml-press"
            style={{ fontSize: 12.5, color: T.primary, fontWeight: 700, cursor: "pointer" }}
          >
            Ver todas →
          </span>
        </div>
        <div style={{ ...recentGrid, ...recentHead }}>
          <span>Cliente</span>
          <span>Plano</span>
          <span>Status</span>
          <span>MRR</span>
          <span>Próx. cobrança</span>
          <span>Uso</span>
        </div>
        <RecentRow
          letter="P" abg="#fef0e6" acol={T.avatarOrange} name="Padaria Pão Quente" city="São Paulo, SP"
          plan="Pro" planColor={T.primary2} status={<Pill kind="ativo" />} mrr="R$ 149" next="12/07" use={78}
        />
        <RecentRow
          letter="A" abg={T.lilacSoft} acol={T.primary} name="Auto Center Silva" city="Campinas, SP"
          plan="Business" planColor={T.primary} status={<Pill kind="ativo" />} mrr="R$ 349" next="08/07" use={45}
        />
        <RecentRow
          letter="S" abg="#fde8f0" acol={T.avatarPink} name="Studio Bella Estética" city="Rio de Janeiro, RJ"
          plan="Starter" planColor="#9a97ad" status={<Pill kind="trial" />} mrr="R$ 0" next="15/07" use={22} useColor={T.amber} last
        />
      </Card>
    </div>
  );
}

/* ---------- subcomponentes ---------- */
const colFull: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
  height: "100%",
};
const barLabel: CSSProperties = { fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 8 };

function WaterfallMid({
  value,
  valColor,
  color,
  barH,
  gap,
  label,
}: {
  value: string;
  valColor: string;
  color: string;
  barH: number;
  gap: number;
  label: string;
}) {
  return (
    <div style={{ ...colFull, position: "relative" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: valColor, marginBottom: 6 }}>{value}</div>
      <div style={{ width: "100%", height: barH, background: color, borderRadius: barH > 8 ? 5 : 4, marginBottom: gap }} />
      <div style={{ position: "absolute", bottom: 29, fontSize: 11, color: T.muted, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

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

function SaleStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", marginTop: 3 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function IdleRow({
  letter, bg, color, name, plan, days, last,
}: {
  letter: string; bg: string; color: string; name: string; plan: string; days: string; last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "9px 0",
        borderBottom: last ? "none" : `1px solid ${T.line2}`,
      }}
    >
      <Avatar letter={letter} bg={bg} color={color} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{name}</div>
        <div style={{ fontSize: 11, color: T.faint }}>{plan}</div>
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: T.amberD,
          background: "rgba(245,158,11,.12)",
          padding: "3px 9px",
          borderRadius: 20,
        }}
      >
        {days}
      </span>
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

const recentGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.1fr",
  gap: 8,
};
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
  letter, abg, acol, name, city, plan, planColor, status, mrr, next, use, useColor = T.primary, last,
}: {
  letter: string; abg: string; acol: string; name: string; city: string; plan: string; planColor: string;
  status: ReactNode; mrr: string; next: string; use: number; useColor?: string; last?: boolean;
}) {
  return (
    <div
      style={{
        ...recentGrid,
        padding: "14px 22px",
        alignItems: "center",
        fontSize: 13,
        borderBottom: last ? "none" : `1px solid ${T.line2}`,
      }}
    >
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
