// admin-login-guard — camada de endurecimento em volta do login do painel admin.
//
// Público (verify_jwt=false): logins que FALHAM não têm JWT, então precisa aceitar
// chamadas anônimas. Não devolve nada sensível — só decide se a tentativa segue.
//
//   action "check"  → conta falhas recentes (em admin_audit_log) por IP e por conta e
//                     decide: allow? captchaRequired? bloqueio temporário? Verifica o
//                     token do Turnstile quando TURNSTILE_SECRET estiver configurado.
//   action "record" → registra a tentativa (sucesso/falha) em admin_audit_log com IP e UA.
//
// Rate-limit: CAPTCHA após 3 falhas (por IP OU por conta); bloqueio temporário após 8
// falhas POR IP (nunca por conta — evita que um atacante tranque o dono só spammando o
// e-mail dele de outro IP). Erro sempre genérico no cliente; aqui não há enumeração.

const URL_BASE = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET") || "";

const WINDOW_MIN = 15;
const CAPTCHA_AFTER = 3;
const BLOCK_AFTER_IP = 8;
const BLOCK_SECONDS = 900;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

async function countFails(filter: string, sinceIso: string): Promise<number> {
  const url = `${URL_BASE}/rest/v1/admin_audit_log?select=id&action=eq.login_failed&created_at=gt.${encodeURIComponent(sinceIso)}&${filter}`;
  const r = await fetch(url, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, Prefer: "count=exact" },
  });
  const range = r.headers.get("content-range"); // formato "0-24/25"
  if (range && range.includes("/")) {
    const total = parseInt(range.split("/")[1], 10);
    if (!Number.isNaN(total)) return total;
  }
  const rows = (await r.json().catch(() => [])) as unknown[];
  return Array.isArray(rows) ? rows.length : 0;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // sem chave configurada → CAPTCHA fica inerte (scaffold)
  if (!token) return false;
  try {
    const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const d = (await r.json()) as { success?: boolean };
    return !!d.success;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { action?: string; email?: string; captchaToken?: string; outcome?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const ip = clientIp(req);
  const email = (body.email || "").trim().toLowerCase().slice(0, 200);
  const ua = (req.headers.get("user-agent") || "").slice(0, 400);

  if (body.action === "check") {
    const sinceIso = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
    const [byIp, byEmail] = await Promise.all([
      countFails(`payload->>ip=eq.${encodeURIComponent(ip)}`, sinceIso),
      email ? countFails(`actor_email=eq.${encodeURIComponent(email)}`, sinceIso) : Promise.resolve(0),
    ]);

    if (byIp >= BLOCK_AFTER_IP) return json({ allow: false, captchaRequired: true, retryAfter: BLOCK_SECONDS });

    const needCaptcha = byIp >= CAPTCHA_AFTER || byEmail >= CAPTCHA_AFTER;
    if (needCaptcha) {
      const ok = await verifyTurnstile(body.captchaToken || "", ip);
      if (!ok) return json({ allow: false, captchaRequired: true });
    }
    return json({ allow: true, captchaRequired: needCaptcha });
  }

  if (body.action === "record") {
    const action = body.outcome === "success" ? "login_success" : "login_failed";
    await fetch(`${URL_BASE}/rest/v1/admin_audit_log`, {
      method: "POST",
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ actor_email: email || null, action, target_type: "auth", payload: { ip, ua, reason: body.reason || null } }),
    }).catch(() => {});
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
});
