import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { T } from "../theme";

export function AuthGate({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <Splash label="Carregando…" />;
  if (!session) return <Login />;
  return <>{children(session)}</>;
}

function Splash({ label }: { label: string }) {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      {label}
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr("E-mail ou senha inválidos.");
    setBusy(false);
  }

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.appBg, padding: 24 }}>
      <form
        onSubmit={submit}
        style={{ width: "100%", maxWidth: 380, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 20, padding: 32, boxShadow: "0 20px 50px rgba(20,17,40,.12)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: T.gradLogo, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>m</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>maisLEAD</div>
            <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 700, letterSpacing: ".08em" }}>SUPERADMIN</div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>Acesso restrito. Entre com sua conta de administrador.</div>

        <label style={labelStyle}>E-mail</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required style={inputStyle} placeholder="voce@maislead.com" />

        <label style={{ ...labelStyle, marginTop: 14 }}>Senha</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required style={inputStyle} placeholder="••••••••" />

        {err && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: T.redD, background: "rgba(244,63,94,.08)", padding: "9px 12px", borderRadius: 10 }}>{err}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{ marginTop: 20, width: "100%", height: 44, borderRadius: 12, border: "none", background: T.gradBtn, color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 700, color: T.body, marginBottom: 6 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: `1px solid ${T.border}`,
  background: "#fbfbfe",
  padding: "0 14px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  color: T.text,
};
