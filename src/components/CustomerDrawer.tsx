import { useState, type CSSProperties } from "react";
import { T } from "../theme";
import { Pill, healthColor } from "../lib/ui";
import { customerAction, type RealCustomer } from "../lib/api";

const label: CSSProperties = { color: T.faint, fontSize: 11.5 };

function ActionBtn({
  children,
  variant = "ghost",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  onClick?: () => void;
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
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
  const styles: Record<string, CSSProperties> = {
    primary: { background: T.primary, color: "#fff" },
    ghost: { background: "#fff", border: `1px solid ${T.border}`, color: T.body },
    danger: { background: "#fff", border: "1px solid #f5d0d6", color: T.redD },
  };
  return (
    <div style={{ ...base, ...styles[variant] }} onClick={disabled ? undefined : onClick}>
      {children}
    </div>
  );
}

function Stat({ v, l }: { v: number | string; l: string }) {
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 800 }}>{v}</div>
      <div style={{ fontSize: 11, color: T.faint }}>{l}</div>
    </div>
  );
}

export function CustomerDrawer({
  client,
  onClose,
  onViewSub,
}: {
  client: RealCustomer;
  onClose: () => void;
  onViewSub: () => void;
}) {
  const hColor = healthColor(client.health);
  const atRisk = client.health < 45;
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const canEmail = client.email && client.email !== "—";

  async function impersonate() {
    setMsg(null);
    setBusy("impersonate");
    try {
      const r = await customerAction("impersonate", { accountId: client.id, email: client.email });
      if (r.link) {
        window.open(r.link, "_blank", "noopener");
        setMsg({ kind: "ok", text: "Link de acesso gerado — aberto em nova aba." });
      } else {
        setMsg({ kind: "err", text: "Não foi possível gerar o link." });
      }
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function suspend() {
    if (!client.userId) return;
    if (!window.confirm(`Suspender a conta de ${client.name}? O acesso será bloqueado.`)) return;
    setMsg(null);
    setBusy("suspend");
    try {
      await customerAction("suspend", { accountId: client.id, userId: client.userId });
      setMsg({ kind: "ok", text: "Conta suspensa. Acesso bloqueado." });
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(20,17,40,.45)", display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 460, maxWidth: "92vw", height: "100%", background: "#faf9fc", boxShadow: T.shadowDrawer, display: "flex", flexDirection: "column", overflowY: "auto" }}
      >
        {/* header */}
        <div style={{ padding: "22px 24px 20px", background: "#fff", borderBottom: "1px solid #eeedf6" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: ".05em", textTransform: "uppercase" }}>Conta do cliente</span>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "#f4f2fb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.body} strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#f1f0f8", color: T.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{client.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{client.name}</div>
              <div style={{ fontSize: 12.5, color: T.muted }}>{client.city}</div>
            </div>
            <Pill kind={client.status} />
          </div>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {atRisk && (
            <div style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff4f5", border: "1px solid #fbd5da", borderRadius: 14, padding: "13px 16px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.redD} strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ fontSize: 12.5, color: "#9f1239" }}><b>Risco de churn.</b> Baixo engajamento — recomendável contato proativo.</div>
            </div>
          )}

          {/* saúde */}
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800 }}>Saúde da conta</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: hColor }}>{client.health}%</span>
            </div>
            <div style={{ height: 9, background: T.line, borderRadius: 5, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: `${client.health}%`, height: "100%", background: hColor }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
              <Stat v={client.leads} l="leads gerados" />
              <Stat v={client.searches} l="buscas" />
              <Stat v={client.emails} l="e-mails enviados" />
            </div>
          </div>

          {/* dados */}
          <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13 }}>
              <div><div style={label}>Plano</div><div style={{ fontWeight: 700, color: T.primary }}>{client.plan}</div></div>
              <div><div style={label}>MRR</div><div style={{ fontWeight: 700 }}>{client.mrr}</div></div>
              <div><div style={label}>LTV acumulado</div><div style={{ fontWeight: 700, color: T.greenD }}>{client.ltv}</div></div>
              <div><div style={label}>Cliente há</div><div style={{ fontWeight: 600 }}>{client.since}</div></div>
              <div><div style={label}>Última atividade</div><div style={{ fontWeight: 600 }}>{client.lastActive}</div></div>
              <div><div style={label}>Telefone</div><div style={{ fontWeight: 600 }}>{client.phone}</div></div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.body }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2"><path d="M4 4h16v16H4z" fill="none" /><path d="m22 6-10 7L2 6" /></svg>
              {client.email}
            </div>
          </div>

          {msg && (
            <div style={{ fontSize: 12.5, padding: "10px 14px", borderRadius: 10, color: msg.kind === "ok" ? T.greenD : T.redD, background: msg.kind === "ok" ? "rgba(16,185,129,.08)" : "rgba(244,63,94,.08)" }}>
              {msg.text}
            </div>
          )}

          {/* ações (reais) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <ActionBtn variant="primary" disabled={!canEmail} onClick={() => { window.location.href = `mailto:${client.email}`; }}>Enviar mensagem</ActionBtn>
            <ActionBtn onClick={onViewSub}>Ver assinatura</ActionBtn>
            <ActionBtn disabled={!canEmail || busy === "impersonate"} onClick={impersonate}>
              {busy === "impersonate" ? "Gerando…" : "Entrar como cliente"}
            </ActionBtn>
            <ActionBtn variant="danger" disabled={!client.userId || busy === "suspend"} onClick={suspend}>
              {busy === "suspend" ? "Suspendendo…" : "Suspender conta"}
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}
