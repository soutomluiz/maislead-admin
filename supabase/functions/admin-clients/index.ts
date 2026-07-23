// admin-clients — cadastro manual de cliente + liga/desliga (SPEC-admin-cadastro-manual)
//
// Ações (POST, só platform_admins):
//   { action: "create", name, email, phone?, city?, cnpj?, plan, kind, sendInvite, password?, active }
//     -> cria auth user (trigger handle_new_user cria account+profile), ajusta account/profile,
//        marca como não-pagante (kind), convite por e-mail (Resend) OU senha inicial, audit.
//        Senha nunca em texto puro: quem grava é o GoTrue do Supabase (hash bcrypt interno).
//   { action: "set_active", accountId, active }
//     -> accounts.active + ban/unban do usuário dono (mesmo mecanismo do suspend), audit.
//
// Segredos: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY (auto),
//           RESEND_API_KEY / RESEND_FROM (opcionais — sem eles o convite volta como link).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function requireAdmin(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return { error: json(401, { error: "no_token" }) };
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return { error: json(401, { error: "invalid_token" }) };
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: pa } = await admin.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!pa) return { error: json(403, { error: "not_admin" }) };
  return { admin, user };
}

const KINDS = ["tester", "cortesia", "parceiro", "interno"] as const;
const PLANS = ["free", "starter", "pro", "business"] as const;
const PLAN_LABEL: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro", business: "Business" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CreateBody {
  action?: string;
  name?: string; email?: string; phone?: string; city?: string; cnpj?: string;
  plan?: string; kind?: string; sendInvite?: boolean; password?: string; active?: boolean;
  accountId?: string;
}

async function sendInviteEmail(email: string, name: string, link: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const from = Deno.env.get("RESEND_FROM") ?? "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from, to: [email],
      subject: "Sua conta na maisLEAD está pronta — defina sua senha",
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#4c2ee0">maisLEAD</h2>
        <p>Olá${name ? `, <b>${name}</b>` : ""}!</p>
        <p>Sua conta na maisLEAD foi criada. Clique no botão abaixo para definir sua senha e começar a usar:</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#4c2ee0;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700">Definir minha senha</a></p>
        <p style="color:#888;font-size:12px">Se você não esperava este e-mail, pode ignorá-lo.</p>
      </div>`,
    }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { admin, user } = auth;

  let body: CreateBody = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const { action } = body;
  if (!action) return json(400, { error: "missing_action" });

  const audit = async (act: string, targetId: string | null, payload: unknown) => {
    await admin.from("admin_audit_log").insert({
      actor_user_id: user.id, actor_email: user.email ?? null,
      action: act, target_type: "account", target_id: targetId, payload,
    });
  };

  try {
    // ============ CRIAR CLIENTE MANUAL ============
    if (action === "create") {
      const name = (body.name ?? "").trim();
      const email = (body.email ?? "").trim().toLowerCase();
      const kind = (body.kind ?? "").trim();
      const plan = (body.plan ?? "starter").trim();
      const sendInvite = body.sendInvite !== false; // padrão: enviar convite
      const password = body.password ?? "";
      const active = body.active !== false; // padrão: ativa

      // validação de servidor (SPEC §4)
      if (!name) return json(400, { error: "missing_name" });
      if (!email || !EMAIL_RE.test(email)) return json(400, { error: "invalid_email" });
      if (!(KINDS as readonly string[]).includes(kind)) return json(400, { error: "invalid_kind" });
      if (!(PLANS as readonly string[]).includes(plan)) return json(400, { error: "invalid_plan" });
      if (!sendInvite && password.length < 8) return json(400, { error: "weak_password" });

      // unicidade de e-mail (o GoTrue também barra; checamos antes pra dar erro claro)
      const { data: existing } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (existing) return json(409, { error: "email_exists" });

      // cria o usuário (senha com hash pelo GoTrue — nunca texto puro).
      // O trigger handle_new_user cria account + profile automaticamente.
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        ...(sendInvite ? {} : { password }),
        user_metadata: { full_name: name, company_name: name },
      });
      if (cErr) {
        const msg = (cErr.message ?? "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) return json(409, { error: "email_exists" });
        return json(400, { error: "create_failed", message: cErr.message });
      }
      const newUserId = created.user.id;

      // account criada pelo trigger
      const { data: prof } = await admin.from("profiles").select("account_id").eq("id", newUserId).single();
      const accountId = prof?.account_id;
      if (!accountId) return json(500, { error: "account_not_created" });

      // marca como conta manual não-pagante (sem Stripe) + dados do formulário
      await admin.from("accounts").update({
        name, plan, kind, active, cnpj: body.cnpj?.trim() || null, created_by: user.id,
      }).eq("id", accountId);
      await admin.from("profiles").update({
        email, company_name: name, phone: body.phone?.trim() || null, location: body.city?.trim() || null,
        trial_status: "inactive", subscription_type: kind,
      }).eq("id", newUserId);

      // convite por e-mail (link de definição de senha) — fallback: devolve o link
      let inviteLink: string | null = null;
      let inviteSent = false;
      if (sendInvite) {
        const { data: linkData, error: lErr } = await admin.auth.admin.generateLink({ type: "recovery", email });
        if (!lErr) {
          inviteLink = linkData.properties?.action_link ?? null;
          if (inviteLink) inviteSent = await sendInviteEmail(email, name, inviteLink);
        }
      }

      // conta desativada já no cadastro → bloqueia o login (mesmo mecanismo do suspend)
      if (!active) await admin.auth.admin.updateUserById(newUserId, { ban_duration: "876000h" });

      await audit("create_client", accountId, { name, email, kind, plan, sendInvite, active, inviteSent });

      // devolve no MESMO shape da lista (RealCustomer) pra UI prender no topo sem recarregar
      const nowIso = new Date().toISOString();
      return json(200, {
        ok: true,
        inviteSent,
        inviteLink: inviteSent ? null : inviteLink, // só devolve o link se o e-mail não foi enviado
        customer: {
          id: accountId, userId: newUserId,
          i: (name[0] || "?").toUpperCase(), name,
          city: body.city?.trim() || "—", email, phone: body.phone?.trim() || "—",
          industry: null, plan: PLAN_LABEL[plan] ?? plan, planPrice: "R$ 0",
          status: "ativo", health: 100, leads: 0, searches: 0, emails: 0,
          lastActive: "hoje", since: "hoje", ltv: "R$ 0", mrr: "R$ 0",
          createdAt: nowIso, idleDays: 0,
          kind, active,
        },
      });
    }

    // ============ LIGA/DESLIGA ============
    if (action === "set_active") {
      const accountId = body.accountId;
      const active = body.active === true;
      if (!accountId) return json(400, { error: "missing_account" });

      const { error: uErr } = await admin.from("accounts").update({ active }).eq("id", accountId);
      if (uErr) return json(400, { error: "update_failed", message: uErr.message });

      // bloqueia/desbloqueia o login do dono da conta
      const { data: owner } = await admin.from("profiles").select("id").eq("account_id", accountId).eq("account_role", "admin").maybeSingle();
      if (owner?.id) {
        await admin.auth.admin.updateUserById(owner.id, { ban_duration: active ? "none" : "876000h" });
      }

      await audit("set_client_active", accountId, { active });
      return json(200, { ok: true, active });
    }

    return json(400, { error: "unknown_action" });
  } catch (e) {
    return json(500, { error: "unexpected", message: String((e as Error).message ?? e) });
  }
});
