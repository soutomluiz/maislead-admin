import type { CSSProperties } from "react";
import { T } from "../theme";
import { Pill } from "../lib/ui";
import type { Sub } from "../data/mock";

const label: CSSProperties = { color: T.faint, fontSize: 11.5 };
const value: CSSProperties = { fontWeight: 600 };

function Action({
  children,
  variant = "ghost",
  span,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  span?: boolean;
}) {
  const base: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    gridColumn: span ? "span 2" : undefined,
  };
  const styles: Record<string, CSSProperties> = {
    primary: { background: T.primary, color: "#fff" },
    ghost: { background: "#fff", border: `1px solid ${T.border}`, color: T.body },
    danger: { background: "#fff", border: "1px solid #f5d0d6", color: T.redD },
  };
  return <div style={{ ...base, ...styles[variant] }}>{children}</div>;
}

export function SubscriptionDrawer({ sub, onClose }: { sub: Sub; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        background: "rgba(20,17,40,.45)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 440,
          maxWidth: "92vw",
          height: "100%",
          background: "#faf9fc",
          boxShadow: T.shadowDrawer,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* header */}
        <div style={{ padding: "22px 24px 20px", background: "#fff", borderBottom: "1px solid #eeedf6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Assinatura
            </span>
            <div
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, background: "#f4f2fb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.body} strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f0f8", color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
              {sub.i}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{sub.name}</div>
              <div style={{ fontSize: 12.5, color: T.muted }}>{sub.city}</div>
            </div>
            <Pill kind={sub.status} />
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* plano + valor */}
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Plano atual</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.primary }}>{sub.plan}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{sub.cycle}</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{sub.mrr}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div><div style={label}>Início</div><div style={value}>{sub.start}</div></div>
              <div><div style={label}>Próx. cobrança</div><div style={value}>{sub.next}</div></div>
              <div><div style={label}>Método</div><div style={value}>{sub.method}</div></div>
              <div><div style={label}>Cliente há</div><div style={value}>{sub.since}</div></div>
              <div><div style={label}>LTV acumulado</div><div style={{ fontWeight: 700, color: T.greenD }}>{sub.ltv}</div></div>
              <div><div style={label}>CNPJ</div><div style={value}>{sub.cnpj}</div></div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.body }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2">
                <path d="M4 4h16v16H4z" fill="none" />
                <path d="m22 6-10 7L2 6" />
              </svg>
              {sub.email}
            </div>
          </div>

          {/* histórico de pagamentos */}
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.line}`, fontSize: 13.5, fontWeight: 800 }}>
              Histórico de pagamentos
            </div>
            {sub.hist.length === 0 ? (
              <div style={{ padding: "18px 20px", textAlign: "center", color: T.faint, fontSize: 12.5 }}>
                Ainda em período de trial — nenhuma cobrança realizada.
              </div>
            ) : (
              sub.hist.map((h, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${T.line2}`, fontSize: 13 }}>
                  <span style={{ color: T.body }}>{h.date}</span>
                  <span style={{ fontWeight: 700 }}>{h.val}</span>
                  <Pill kind={h.status} />
                </div>
              ))
            )}
          </div>

          {/* ações */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Action variant="primary">Mudar plano</Action>
            <Action>Aplicar cupom</Action>
            <Action>Pausar</Action>
            <Action>Reenviar recibo</Action>
            <Action variant="danger" span>Cancelar assinatura</Action>
          </div>
        </div>
      </div>
    </div>
  );
}
