import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase } from "../lib/supabase";
import { checkLogin, recordAttempt } from "../lib/loginGuard";
import { isTrusted, trustFor30Days } from "./trustDevice";

// ============================================================================
// maisLEAD Admin — Tela de login (SPEC-admin-login.md + maisLEAD Admin Login.dc.html).
// Layout de duas colunas: painel de controle à esquerda, formulário à direita.
// Fluxo real: credenciais → (enroll TOTP no 1º acesso | verify TOTP) via Supabase MFA.
// Paleta local fiel ao SPEC (§0) — não usa os tokens do shell (que são um roxo diferente).
// ============================================================================

const C = {
  primary: "#4c2ee0",
  primaryHover: "#3f24c4",
  primaryLight: "#5b3ae8",
  lilac: "#b9a4ff",
  lilac2: "#c2aeff",
  badge: "#c9befb",
  green: "#34d399",
  greenLight: "#6ee7b7",
  text: "#211d3b",
  sec: "#6f6a8c",
  ter: "#8f8ba8",
  muted: "#a6a3c0",
  border: "#e4e1f0",
  divider: "#f0edf8",
  page: "#fdfcff",
  fieldOff: "#f8f7fd",
  pill: "#f2f0fa",
  aviso: "#faf9fe",
  errText: "#c81e42",
  errBorder: "#f6d3d9",
  errBg: "rgba(244,63,94,.07)",
};

const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || "";

// Estilos globais (keyframes, media queries, placeholder, cascata de animação).
const GLOBAL_CSS = `
.mla-login *{box-sizing:border-box;}
.mla-login input{font-family:inherit;}
.mla-login input::placeholder{color:${C.muted};}
@keyframes mlaFadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
@keyframes mlaFadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes mlaSlideL{from{opacity:0;transform:translateX(-22px);}to{opacity:1;transform:translateX(0);}}
@keyframes mlaDrift{0%{transform:translate(0,0) scale(1);}50%{transform:translate(24px,-20px) scale(1.05);}100%{transform:translate(0,0) scale(1);}}
@keyframes mlaLivedot{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55);}70%{box-shadow:0 0 0 9px rgba(16,185,129,0);}100%{box-shadow:0 0 0 0 rgba(16,185,129,0);}}
@keyframes mlaSpin{to{transform:rotate(360deg);}}
.mla-sl>*{animation:mlaSlideL .6s cubic-bezier(.22,.61,.36,1) both;}
.mla-sl>*:nth-child(1){animation-delay:.08s;}
.mla-sl>*:nth-child(2){animation-delay:.18s;}
.mla-sl>*:nth-child(3){animation-delay:.28s;}
.mla-sl>*:nth-child(4){animation-delay:.38s;}
.mla-sl>*:nth-child(5){animation-delay:.48s;}
.mla-st>*{animation:mlaFadeUp .58s cubic-bezier(.22,.61,.36,1) both;}
.mla-st>*:nth-child(1){animation-delay:.05s;}
.mla-st>*:nth-child(2){animation-delay:.12s;}
.mla-st>*:nth-child(3){animation-delay:.19s;}
.mla-st>*:nth-child(4){animation-delay:.26s;}
.mla-st>*:nth-child(5){animation-delay:.33s;}
.mla-st>*:nth-child(6){animation-delay:.40s;}
.mla-st>*:nth-child(7){animation-delay:.47s;}
.mla-eye:hover{background:${C.pill};}
@media (max-width:980px){.mla-brandpane{display:none!important;}}
@media (prefers-reduced-motion:reduce){.mla-login *{animation:none!important;}}
`;

type Phase = "cred" | "verify" | "enroll";

// ---- ícones ----------------------------------------------------------------
const Star = ({ s = 20, stroke = "#fff", w = 2.2 }: { s?: number; stroke?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.2 5.4L20 9.3l-4 4 1 5.7-5-3-5 3 1-5.7-4-4 5.8-.9z" />
  </svg>
);
const Shield = ({ s = 13, stroke = "rgba(255,255,255,.5)", w = 2.2 }: { s?: number; stroke?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={w}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const NOTE_ICONS: string[] = [
  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", // escudo
  "M12 8v4l3 2M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", // relógio
  "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", // check
];
const NOTE_TEXT = [
  "Sessões protegidas por verificação em duas etapas.",
  "Sessão expira automaticamente por inatividade.",
  "Cada ação no painel fica registrada em auditoria.",
];

export function AdminLogin() {
  const [phase, setPhase] = useState<Phase>("cred");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [trust, setTrust] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState(""); // banner neutro (ex.: recuperar senha)
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  // MFA
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [enrollQr, setEnrollQr] = useState("");
  const [enrollSecret, setEnrollSecret] = useState("");

  // CAPTCHA (Turnstile) — só entra em cena depois de N falhas E se a site key existir.
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const isCode = phase === "verify" || phase === "enroll";

  // Se já existe sessão (reload no meio do MFA), resolve a fase inicial pelo estado real.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive || !data.session) return;
      const { data: fl } = await supabase.auth.mfa.listFactors();
      const verified = (fl?.totp ?? []).filter((f) => f.status === "verified");
      if (verified.length === 0) void startEnroll();
      else void startChallenge(verified[0].id);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- MFA helpers ---------------------------------------------------------
  async function startEnroll() {
    setPhase("enroll");
    const { data: fl } = await supabase.auth.mfa.listFactors();
    for (const f of fl?.totp ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `admin-${Date.now()}` });
    if (error || !data) {
      setErr("Não foi possível iniciar o cadastro do 2FA.");
      return;
    }
    setFactorId(data.id);
    setEnrollQr(data.totp.qr_code);
    setEnrollSecret(data.totp.secret);
    const ch = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (ch.data) setChallengeId(ch.data.id);
  }

  async function startChallenge(fid: string) {
    setPhase("verify");
    setFactorId(fid);
    const ch = await supabase.auth.mfa.challenge({ factorId: fid });
    if (ch.error || !ch.data) {
      setErr("Não foi possível iniciar a verificação.");
      return;
    }
    setChallengeId(ch.data.id);
  }

  // ---- etapa 1: credenciais ------------------------------------------------
  async function submitCred() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr("Informe um e-mail válido.");
    if (!pass) return setErr("Digite sua senha.");
    setErr("");
    setNotice("");
    setLoading(true);

    const guard = await checkLogin(email.trim(), captchaToken || undefined);
    if (guard.captchaRequired && !captchaToken) {
      setCaptchaRequired(true);
      setErr(TURNSTILE_SITE_KEY ? "Confirme que você não é um robô para continuar." : "");
      setLoading(false);
      return;
    }
    if (!guard.allow) {
      setErr("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error || !data.user) {
      await recordAttempt(email.trim(), "failed", "password");
      setCaptchaToken("");
      setErr("Credenciais inválidas."); // genérico — sem enumeração de usuário (SPEC 7.1)
      setLoading(false);
      return;
    }
    await recordAttempt(email.trim(), "success", "password");

    const { data: fl } = await supabase.auth.mfa.listFactors();
    const verified = (fl?.totp ?? []).filter((f) => f.status === "verified");
    if (verified.length === 0) {
      await startEnroll(); // 1º acesso: cadastra o autenticador
    } else if (isTrusted(data.user.id)) {
      // dispositivo confiável → dispensa o 2FA; o AuthGate assume daqui.
    } else {
      await startChallenge(verified[0].id);
    }
    setLoading(false);
  }

  // ---- etapa 2: código (enroll + verify) -----------------------------------
  async function submitCode() {
    if (code.replace(/\D/g, "").length !== 6) return setErr("O código tem 6 dígitos.");
    setErr("");
    setLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) {
      await recordAttempt(email.trim() || "(sessão)", "failed", "totp");
      const ch = await supabase.auth.mfa.challenge({ factorId }); // desafio é consumido; renova
      if (ch.data) setChallengeId(ch.data.id);
      setCode("");
      setErr("Código inválido. Tente novamente.");
      setLoading(false);
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (trust && u.user) trustFor30Days(u.user.id);
    await recordAttempt(email.trim() || u.user?.email || "(sessão)", "success", "totp");
    // sessão agora é AAL2 → o AuthGate troca para o painel.
    setLoading(false);
  }

  async function backToCred() {
    await supabase.auth.signOut();
    setPhase("cred");
    setCode("");
    setEnrollQr("");
    setEnrollSecret("");
    setErr("");
    setNotice("");
  }

  async function forgotPassword() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErr("Informe um e-mail válido.");
    setErr("");
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setNotice("Se este e-mail tiver acesso, enviamos um link para redefinir a senha."); // genérico
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (phase === "cred") void submitCred();
    else void submitCode();
  }

  // ---- estilos de campo (foco/preenchido) ----------------------------------
  const fs = (key: string, filled: boolean) => {
    const on = focus === key;
    return {
      border: `1.5px solid ${on ? C.primary : filled ? "#d9d4ee" : C.border}`,
      background: on ? "#fff" : C.fieldOff,
      icon: on ? C.primary : C.muted,
    };
  };
  const em = fs("email", !!email);
  const pw = fs("pass", !!pass);
  const cd = fs("code", !!code);

  const envLabel = useMemo(() => (typeof window !== "undefined" && window.location.hostname === "admin.maislead.com" ? "Produção" : "Staging"), []);

  const title = phase === "cred" ? "Acesso administrativo" : phase === "enroll" ? "Configure a verificação em duas etapas" : "Verificação em duas etapas";
  const subline =
    phase === "cred"
      ? "Entre com suas credenciais de administrador para gerenciar a plataforma."
      : phase === "enroll"
      ? "Escaneie o QR no seu app autenticador e digite o código de 6 dígitos para ativar."
      : "Abra seu app autenticador e confirme o código para abrir o painel.";
  const btnLabel = phase === "cred" ? "Continuar" : phase === "enroll" ? "Ativar 2FA e entrar" : "Verificar e entrar";
  const loadingLabel = phase === "cred" ? "Validando…" : "Verificando…";

  return (
    <div className="mla-login" style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", minHeight: "100vh", display: "flex", background: "#fff", color: C.text }}>
      <style>{GLOBAL_CSS}</style>

      {/* ═══════════ PAINEL DE CONTROLE (esquerda) ═══════════ */}
      <div
        className="mla-brandpane"
        style={{ width: "47%", maxWidth: 660, flexShrink: 0, background: "radial-gradient(115% 85% at 12% 6%,#2f2064 0%,#1a1145 44%,#0d0a1f 100%)", color: "#fff", padding: "44px 52px 40px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", top: -150, right: -130, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,92,255,.22) 0%,rgba(124,92,255,0) 70%)", animation: "mlaDrift 18s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -110, left: -90, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(52,211,153,.12) 0%,rgba(52,211,153,0) 70%)", animation: "mlaDrift 24s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.038) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.038) 1px,transparent 1px)", backgroundSize: "52px 52px", maskImage: "radial-gradient(88% 68% at 38% 28%,#000 18%,transparent 76%)", WebkitMaskImage: "radial-gradient(88% 68% at 38% 28%,#000 18%,transparent 76%)" }} />

        <div className="mla-sl" style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1 }}>
          {/* logo + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star s={20} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.01em" }}>
                mais<span style={{ color: C.lilac }}>LEAD</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: C.badge, background: "rgba(124,92,255,.22)", border: "1px solid rgba(160,130,255,.3)", padding: "4px 8px", borderRadius: 6 }}>Admin</span>
            </div>
          </div>

          {/* status + headline + subtítulo */}
          <div style={{ marginTop: "auto", paddingTop: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,.12)", border: "1px solid rgba(52,211,153,.26)", padding: "7px 14px 7px 11px", borderRadius: 30, fontSize: 12.5, fontWeight: 700, color: C.greenLight }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "mlaLivedot 2.4s ease-out infinite" }} />
              Todos os sistemas operacionais
            </div>
            <div style={{ fontSize: 38, lineHeight: 1.16, fontWeight: 800, letterSpacing: "-.028em", marginTop: 22, maxWidth: "9em" }}>
              Centro de
              <br />
              <span style={{ background: "linear-gradient(96deg,#fff 20%,#b9a4ff 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>controle</span>
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,.62)", marginTop: 14, maxWidth: "28em", fontWeight: 500 }}>
              Assinaturas, clientes, faturamento e integrações da plataforma — em tempo real, num só lugar.
            </div>
          </div>

          {/* card Serviços (deliberadamente genérico — SPEC §7.1) */}
          <div style={{ marginTop: 30, background: "rgba(255,255,255,.055)", border: "1px solid rgba(255,255,255,.11)", borderRadius: 17, padding: "17px 19px", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>Serviços</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.4)" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, animation: "mlaLivedot 2.4s ease-out infinite" }} />
                Monitorado 24/7
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {["Aplicação", "Buscas", "Cobranças", "Enriquecimento"].map((name) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, flexShrink: 0, boxShadow: "0 0 8px rgba(52,211,153,.5)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.82)", flex: 1 }}>{name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: C.green }}>operacional</span>
                </div>
              ))}
            </div>
          </div>

          {/* avisos de segurança */}
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            {NOTE_TEXT.map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 13, padding: "12px 14px" }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(124,92,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.lilac2} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d={NOTE_ICONS[i]} />
                  </svg>
                </span>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.66)", fontWeight: 600, lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* rodapé */}
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 13, fontSize: 12, color: "rgba(255,255,255,.42)", fontWeight: 600 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Shield />
              Acesso restrito &amp; auditado
            </span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,.16)" }} />
            <span>admin.maislead.com</span>
          </div>
        </div>
      </div>

      {/* ═══════════ FORMULÁRIO (direita) ═══════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "26px 32px 32px", background: C.page, minWidth: 0 }}>
        {/* pill de ambiente */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, animation: "mlaFadeIn .5s ease both" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: C.sec, background: C.pill, padding: "6px 12px", borderRadius: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "mlaLivedot 2.4s ease-out infinite" }} />
            {envLabel}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 0" }}>
          <form className="mla-st" onSubmit={onSubmit} noValidate style={{ width: "100%", maxWidth: 400 }}>
            {/* logo compacto */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(150deg,#5b3ae8,#3f24c4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 5px 15px rgba(76,46,224,.28)" }}>
                <Star s={18} w={2.3} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: "-.01em" }}>
                  mais<span style={{ color: C.primary }}>LEAD</span>
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: C.primary, background: "#efecfd", padding: "3px 7px", borderRadius: 5 }}>Admin</span>
              </div>
            </div>

            {/* título / subtítulo */}
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.028em", lineHeight: 1.2 }}>{title}</div>
              <div style={{ fontSize: 14, color: C.sec, marginTop: 9, fontWeight: 500, lineHeight: 1.55 }}>{subline}</div>
            </div>

            {/* ETAPA 1: credenciais */}
            {phase === "cred" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
                <div>
                  <label htmlFor="mla-email" style={labelStyle}>E-mail administrativo</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={em.icon} strokeWidth={2}>
                        <rect x="2" y="4" width="20" height="16" rx="2.5" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>
                    <input
                      id="mla-email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                      onFocus={() => setFocus("email")}
                      onBlur={() => setFocus(null)}
                      type="email"
                      autoComplete="email"
                      placeholder="voce@maislead.com"
                      style={{ ...inputBase, border: em.border, background: em.background }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
                    <label htmlFor="mla-pass" style={{ ...labelStyle, marginBottom: 0 }}>Senha</label>
                    <button type="button" onClick={forgotPassword} style={{ ...linkBtn, fontSize: 12 }}>Esqueci a senha</button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={pw.icon} strokeWidth={2}>
                        <rect x="3" y="11" width="18" height="11" rx="2.5" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="mla-pass"
                      value={pass}
                      onChange={(e) => { setPass(e.target.value); setErr(""); }}
                      onFocus={() => setFocus("pass")}
                      onBlur={() => setFocus(null)}
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••"
                      style={{ ...inputBase, border: pw.border, background: pw.background, padding: "0 46px 0 42px" }}
                    />
                    <button
                      type="button"
                      className="mla-eye"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                      style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: 9, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background .16s ease" }}
                    >
                      <EyeIcon off={showPw} />
                    </button>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 13, color: "#4b4767", fontWeight: 600, marginTop: 2 }}>
                  <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  <span style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${trust ? C.primary : "#d3cfe6"}`, background: trust ? C.primary : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .18s ease" }}>
                    {trust && (
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  Confiar neste dispositivo por 30 dias
                </label>
              </div>
            )}

            {/* ETAPA 2: código (enroll + verify) */}
            {isCode && (
              <div style={{ marginTop: 26, animation: "mlaFadeUp .4s cubic-bezier(.22,.61,.36,1) both" }}>
                {phase === "enroll" && (
                  <div style={{ display: "flex", gap: 15, alignItems: "center", background: "#f7f5ff", border: "1px solid #e6e0fb", borderRadius: 13, padding: 15, marginBottom: 16 }}>
                    <div style={{ width: 116, height: 116, flexShrink: 0, background: "#fff", borderRadius: 10, padding: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {enrollQr ? (
                        enrollQr.startsWith("data:") ? (
                          <img src={enrollQr} width={104} height={104} alt="QR do autenticador" />
                        ) : (
                          <div style={{ width: 104, height: 104 }} dangerouslySetInnerHTML={{ __html: enrollQr }} />
                        )
                      ) : (
                        <span style={{ fontSize: 11, color: C.muted }}>Gerando…</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "#453f66", fontWeight: 700, marginBottom: 5 }}>Escaneie no app autenticador</div>
                      <div style={{ fontSize: 11, color: C.sec, fontWeight: 600, lineHeight: 1.5 }}>Ou digite a chave manualmente:</div>
                      {enrollSecret && (
                        <code style={{ display: "block", marginTop: 5, fontSize: 11, fontWeight: 700, color: C.primary, wordBreak: "break-all", letterSpacing: ".02em" }}>{enrollSecret}</code>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 11, background: "#f7f5ff", border: "1px solid #e6e0fb", borderRadius: 13, padding: "13px 15px" }}>
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth={2.2} style={{ flexShrink: 0 }}>
                    <rect x="5" y="2" width="14" height="20" rx="2.6" />
                    <path d="M12 18h.01" />
                  </svg>
                  <div style={{ fontSize: 12.5, color: "#453f66", fontWeight: 600, lineHeight: 1.5 }}>Abra seu app autenticador e digite o código de 6 dígitos.</div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <label htmlFor="mla-code" style={{ ...labelStyle, marginBottom: 8 }}>Código de verificação</label>
                  <input
                    id="mla-code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErr(""); }}
                    onFocus={() => setFocus("code")}
                    onBlur={() => setFocus(null)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    style={{ width: "100%", height: 60, border: cd.border, background: cd.background, borderRadius: 13, padding: "0 18px", fontSize: 27, fontWeight: 800, letterSpacing: ".42em", textAlign: "center", color: C.text, outline: "none", transition: "all .18s ease" }}
                  />
                </div>

                <button type="button" onClick={backToCred} style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, color: C.sec, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                  Usar outro e-mail
                </button>
              </div>
            )}

            {/* CAPTCHA condicional (Turnstile) */}
            {captchaRequired && TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setCaptchaToken} />}

            {/* banner neutro (recuperar senha) */}
            {notice && (
              <div style={{ marginTop: 16, background: "#f2f7ff", border: "1px solid #d7e6fb", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "#2b5a9e", lineHeight: 1.5 }}>{notice}</div>
            )}

            {/* faixa de erro */}
            {err && (
              <div style={{ marginTop: 16, background: C.errBg, border: `1px solid ${C.errBorder}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, fontWeight: 600, color: C.errText, animation: "mlaFadeUp .3s ease both" }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{err}</span>
              </div>
            )}

            {/* botão */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", height: 52, marginTop: 20, border: "none", borderRadius: 14, background: "linear-gradient(140deg,#5b3ae8,#4c2ee0 55%,#3f24c4)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 8px 22px rgba(76,46,224,.3)", opacity: loading ? 0.85 : 1 }}
            >
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", animation: "mlaSpin .7s linear infinite", display: "inline-block" }} />
                  {loadingLabel}
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                  {btnLabel}
                  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              )}
            </button>

            {/* aviso de auditoria */}
            <div style={{ marginTop: 22, background: C.aviso, border: `1px solid ${C.divider}`, borderRadius: 13, padding: "13px 15px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={C.ter} strokeWidth={2.1} style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div style={{ fontSize: 11.5, color: C.sec, fontWeight: 600, lineHeight: 1.55 }}>Área restrita à equipe maisLEAD. Todo acesso é registrado com IP, dispositivo e horário.</div>
            </div>
          </form>
        </div>

        {/* rodapé da coluna (destinos não-existentes ficam como texto, não link) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 11.5, color: C.muted, fontWeight: 600, animation: "mlaFadeIn .6s ease .5s both" }}>
          <span>maisLEAD Admin v2.0</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d6d2e6" }} />
          <span>Status</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d6d2e6" }} />
          <span>Suporte interno</span>
        </div>
      </div>
    </div>
  );
}

// Olho (mostrar/ocultar senha)
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={C.ter} strokeWidth={2}>
      {off ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="m1 1 22 22" />
        </>
      ) : (
        <>
          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

// Widget Cloudflare Turnstile — só renderiza quando há site key (scaffold).
function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } };
    const mount = () => {
      if (ref.current && w.turnstile) w.turnstile.render(ref.current, { sitekey: siteKey, callback: (t: string) => onToken(t) });
    };
    if (w.turnstile) {
      mount();
    } else if (!document.getElementById("cf-turnstile-script")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile-script";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.onload = mount;
      document.head.appendChild(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);
  return <div ref={ref} style={{ marginTop: 16 }} />;
}

const labelStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: "#4b4767", display: "block", marginBottom: 7 };
const inputBase: CSSProperties = { width: "100%", height: 50, borderRadius: 13, padding: "0 14px 0 42px", fontSize: 14.5, color: C.text, outline: "none", transition: "all .18s ease" };
const linkBtn: CSSProperties = { fontWeight: 700, color: C.primary, background: "none", border: "none", padding: 0, cursor: "pointer" };
