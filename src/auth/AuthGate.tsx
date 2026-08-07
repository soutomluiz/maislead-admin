import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { T } from "../theme";
import { AdminLogin } from "./AdminLogin";
import { isTrusted } from "./trustDevice";

// Gate de autenticação do painel admin.
//
// "Ter sessão" NÃO basta: depois da senha, a sessão fica em AAL1. Só liberamos o
// painel quando o 2FA está satisfeito — ou seja, sessão em AAL2, OU dispositivo
// confiável (que dispensa o 2FA por 30 dias) com um fator TOTP já verificado.
// Sem fator verificado → força o cadastro do autenticador (AdminLogin resolve a fase).
export function AuthGate({ children }: { children: (session: Session) => ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [fullyAuthed, setFullyAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!session) {
        if (alive) {
          setFullyAuthed(false);
          setReady(true);
        }
        return;
      }
      const [{ data: fl }, { data: aal }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (!alive) return;
      const hasVerified = (fl?.totp ?? []).some((f) => f.status === "verified");
      const ok = hasVerified && (aal?.currentLevel === "aal2" || isTrusted(session.user.id));
      setFullyAuthed(ok);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [session]);

  if (!ready) return <Splash label="Carregando…" />;
  if (!fullyAuthed || !session) return <AdminLogin />;
  return <>{children(session)}</>;
}

function Splash({ label }: { label: string }) {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
      {label}
    </div>
  );
}
