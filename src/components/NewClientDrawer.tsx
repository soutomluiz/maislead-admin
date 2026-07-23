import { useState, type CSSProperties, type ReactNode } from "react";
import { T } from "../theme";
import { Toggle } from "../lib/ui";
import { createManualClient, type ClientKind, type NewClientPayload, type RealCustomer } from "../lib/api";

// Drawer de cadastro manual de cliente (SPEC-admin-cadastro-manual).
// Mesmo padrão visual dos drawers de detalhe: overlay + painel branco pela direita.

const KINDS: { key: ClientKind; emoji: string; title: string; desc: string }[] = [
  { key: "tester", emoji: "🧪", title: "Tester", desc: "acesso completo p/ testes internos" },
  { key: "cortesia", emoji: "🎁", title: "Cortesia", desc: "conta gratuita (parceiro, indicação, brinde)" },
  { key: "parceiro", emoji: "🤝", title: "Parceiro", desc: "revenda / afiliado com acesso especial" },
  { key: "interno", emoji: "🏢", title: "Interno", desc: "equipe maisLEAD (suporte, demonstração)" },
];

const ERROR_MSG: Record<string, string> = {
  missing_name: "Informe o nome da empresa.",
  invalid_email: "E-mail inválido.",
  email_exists: "Já existe uma conta com esse e-mail.",
  invalid_kind: "Selecione o tipo de conta.",
  invalid_plan: "Plano inválido.",
  weak_password: "Senha inicial precisa de pelo menos 8 caracteres.",
  not_admin: "Sua conta não tem permissão de superadmin.",
};

const lbl: CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: T.faint, marginBottom: 6 };
const inp: CSSProperties = {
  width: "100%", height: 42, padding: "0 13px", borderRadius: 11,
  border: `1px solid ${T.border}`, background: "#fff", color: T.text,
  fontSize: 13, outline: "none", fontFamily: "inherit",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label style={lbl}>
        {label} {required && <span style={{ color: T.redD }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function NewClientDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: RealCustomer) => void;
}) {
  const [kind, setKind] = useState<ClientKind | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [plan, setPlan] = useState<NewClientPayload["plan"]>("starter");
  const [sendInvite, setSendInvite] = useState(true);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Convite não pôde ser enviado por e-mail → mostramos o link pro admin copiar.
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setErr(null);
    // validação de cliente (o servidor revalida tudo)
    if (!kind) { setErr(ERROR_MSG.invalid_kind); return; }
    if (!name.trim()) { setErr(ERROR_MSG.missing_name); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErr(ERROR_MSG.invalid_email); return; }
    if (!sendInvite && password.length < 8) { setErr(ERROR_MSG.weak_password); return; }

    setBusy(true);
    try {
      const r = await createManualClient({
        name: name.trim(), email: email.trim(), phone: phone.trim() || undefined,
        city: city.trim() || undefined, cnpj: cnpj.trim() || undefined,
        plan, kind, sendInvite, password: sendInvite ? undefined : password, active,
      });
      onCreated(r.customer);
      if (r.inviteLink) {
        // e-mail não saiu (Resend indisponível) — deixa o link visível pro admin enviar na mão
        setPendingLink(r.inviteLink);
      } else {
        onClose();
      }
    } catch (e) {
      const code = (e as Error).message;
      setErr(ERROR_MSG[code] ?? `Não foi possível criar o cliente (${code}).`);
    } finally {
      setBusy(false);
    }
  }

  const kindCard = (k: (typeof KINDS)[number]): CSSProperties => ({
    border: `1.5px solid ${kind === k.key ? T.primary : T.border}`,
    background: kind === k.key ? T.lilacSoft : "#fff",
    borderRadius: 14, padding: "13px 14px", cursor: "pointer",
  });

  return (
    <div
      onClick={onClose}
      className="ml-overlay"
      style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(20,17,40,.45)", display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ml-drawer"
        style={{ width: 460, maxWidth: "92vw", height: "100%", background: "#faf9fc", boxShadow: T.shadowDrawer, display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div style={{ padding: "22px 24px 18px", background: "#fff", borderBottom: "1px solid #eeedf6", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: ".05em", textTransform: "uppercase" }}>Novo cliente</span>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>Cadastro manual</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Libera a conta direto no banco — sem passar pelo Stripe.</div>
            </div>
            <div
              onClick={onClose}
              className="ml-press"
              style={{ width: 32, height: 32, borderRadius: 9, background: "#f4f2fb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.body} strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </div>
          </div>
        </div>

        {/* corpo (scroll) */}
        <div className="rows" style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* convite criado mas e-mail não enviado — link manual */}
          {pendingLink && (
            <div style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 14, padding: "14px 16px", fontSize: 12.5 }}>
              <div style={{ fontWeight: 800, color: T.greenD, marginBottom: 6 }}>Cliente criado! ✓</div>
              <div style={{ color: T.body, marginBottom: 8 }}>
                O e-mail de convite não pôde ser enviado automaticamente. Copie o link abaixo e envie pro cliente definir a senha:
              </div>
              <input readOnly value={pendingLink} onFocus={(e) => e.currentTarget.select()} style={{ ...inp, fontSize: 11.5, background: "#fff" }} />
              <div
                onClick={onClose}
                className="ml-press ml-btn-primary"
                style={{ marginTop: 10, height: 40, borderRadius: 11, background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Concluir
              </div>
            </div>
          )}

          {!pendingLink && (
            <>
              {/* tipo de conta — 4 cards 2x2 */}
              <div>
                <label style={lbl}>Tipo de conta <span style={{ color: T.redD }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {KINDS.map((k) => (
                    <div key={k.key} onClick={() => setKind(k.key)} className="ml-press" style={kindCard(k)}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: kind === k.key ? T.primary : T.text }}>
                        {k.emoji} {k.title}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1.35 }}>{k.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* formulário */}
              <Field label="Nome da empresa" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Imobiliária Horizonte" style={inp} />
              </Field>
              <Field label="E-mail de acesso" required>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@empresa.com" type="email" style={inp} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Telefone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(48) 99999-0000" style={inp} />
                </Field>
                <Field label="Cidade/UF">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Biguaçu, SC" style={inp} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="CNPJ">
                  <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" style={inp} />
                </Field>
                <Field label="Plano liberado">
                  <select value={plan} onChange={(e) => setPlan(e.target.value as NewClientPayload["plan"])} style={{ ...inp, cursor: "pointer" }}>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </Field>
              </div>

              {/* acesso */}
              <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: T.body, cursor: "pointer" }}>
                  <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} style={{ width: 15, height: 15, accentColor: T.primary, cursor: "pointer" }} />
                  Enviar convite por e-mail para o cliente definir a senha
                </label>
                {!sendInvite && (
                  <div style={{ marginTop: 12 }}>
                    <Field label="Senha inicial" required>
                      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="mín. 8 caracteres" style={inp} />
                    </Field>
                  </div>
                )}
              </div>

              {/* conta ativa */}
              <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Conta ativa</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>Se desligado, o cliente entra desativado.</div>
                </div>
                <Toggle on={active} onClick={() => setActive((v) => !v)} />
              </div>

              {/* faixa de erro */}
              {err && (
                <div style={{ fontSize: 12.5, padding: "11px 14px", borderRadius: 10, color: T.redD, background: "rgba(244,63,94,.08)", border: "1px solid rgba(244,63,94,.25)" }}>
                  {err}
                </div>
              )}
            </>
          )}
        </div>

        {/* rodapé fixo */}
        {!pendingLink && (
          <div style={{ flexShrink: 0, padding: "14px 24px", background: "#fff", borderTop: "1px solid #eeedf6", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
            <div
              onClick={onClose}
              className="ml-press"
              style={{ height: 44, borderRadius: 12, border: `1px solid ${T.border}`, background: "#fff", color: T.body, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Cancelar
            </div>
            <div
              onClick={submit}
              className="ml-press ml-btn-primary"
              style={{ height: 44, borderRadius: 12, background: T.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontWeight: 700, fontSize: 13, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? (
                "Criando…"
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>
                  Criar cliente
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
