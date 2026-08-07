import { useEffect } from "react";
import { supabase } from "../lib/supabase";

// Sessão curta com expiração por inatividade (SPEC 7.2). Após `minutes` sem
// interação, encerra a sessão. O token de "confiar no dispositivo" é preservado
// (é de dispositivo, não de sessão), então o próximo login não repete o 2FA.
export function useIdleLogout(minutes = 45): void {
  useEffect(() => {
    let timer: number;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void supabase.auth.signOut();
      }, minutes * 60 * 1000);
    };
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, arm));
    };
  }, [minutes]);
}
