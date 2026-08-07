// "Confiar neste dispositivo por 30 dias".
//
// NOTA DE SEGURANÇA: o SPEC pede um cookie httpOnly. Num SPA estático (Netlify +
// supabase-js), o front não consegue setar cookie httpOnly — a sessão do Supabase já
// vive em localStorage. Então o token de confiança fica em localStorage também. Ele NÃO
// dá acesso sozinho: só dispensa a etapa de 2FA para quem JÁ passou pela senha e tem um
// fator TOTP verificado. Para httpOnly de verdade seria preciso um backend de sessão
// (padrão BFF) — decisão registrada como fora do escopo desta passada.

const TRUST_KEY = "maislead-admin-trust";
const DEVICE_KEY = "maislead-admin-device";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function isTrusted(userId: string): boolean {
  try {
    const raw = localStorage.getItem(TRUST_KEY);
    if (!raw) return false;
    const t = JSON.parse(raw) as { uid?: string; until?: number; dev?: string };
    return t.uid === userId && t.dev === deviceId() && typeof t.until === "number" && t.until > Date.now();
  } catch {
    return false;
  }
}

export function trustFor30Days(userId: string): void {
  localStorage.setItem(TRUST_KEY, JSON.stringify({ uid: userId, dev: deviceId(), until: Date.now() + THIRTY_DAYS }));
}

export function clearTrust(): void {
  localStorage.removeItem(TRUST_KEY);
}
