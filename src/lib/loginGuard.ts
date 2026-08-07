// Cliente da edge function `admin-login-guard`.
//
// A função faz, no servidor: rate-limit por IP e por conta (contando tentativas
// recentes em admin_audit_log), verificação de CAPTCHA (Cloudflare Turnstile, quando
// as chaves estiverem configuradas) e auditoria de cada tentativa. A checagem de
// credencial em si continua no supabase-js (não é um BFF) — esta função é a camada
// de endurecimento em volta.
//
// fail-open: se a guarda falhar (rede/função fora), NÃO travamos o login — o dono não
// pode ficar de fora do próprio painel por causa de um hiccup. Os limites nativos do
// Supabase Auth continuam valendo como rede de segurança.

import { supabase } from "./supabase";

const FN = "admin-login-guard";

export interface GuardCheck {
  allow: boolean;
  captchaRequired: boolean;
  retryAfter?: number; // segundos até poder tentar de novo (quando bloqueado)
}

export async function checkLogin(email: string, captchaToken?: string): Promise<GuardCheck> {
  try {
    const { data, error } = await supabase.functions.invoke(FN, {
      body: { action: "check", email, captchaToken },
    });
    if (error || !data) return { allow: true, captchaRequired: false };
    return { allow: data.allow !== false, captchaRequired: !!data.captchaRequired, retryAfter: data.retryAfter };
  } catch {
    return { allow: true, captchaRequired: false };
  }
}

export async function recordAttempt(email: string, outcome: "success" | "failed", reason?: string): Promise<void> {
  try {
    await supabase.functions.invoke(FN, { body: { action: "record", email, outcome, reason } });
  } catch {
    /* auditoria é best-effort; nunca bloqueia o fluxo */
  }
}
