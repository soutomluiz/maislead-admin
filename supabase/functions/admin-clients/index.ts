// admin-clients — cadastro manual de cliente + liga/desliga (SPEC-admin-cadastro-manual)
//
// Ações (POST, só platform_admins):
//   { action: "create", name, email, phone?, city?, cnpj?, plan, kind, sendInvite, password?, active }
//     -> cria auth user (trigger handle_new_user cria account+profile), ajusta account/profile,
//        marca como não-pagante (kind), convite por e-mail (Resend) OU senha inicial, audit.
//        Senha nunca em texto puro: quem grava é o GoTrue do Supabase (hash bcrypt interno).
//   { action: "set_active", accountId, active }
//     -> accounts.active + ban/unban do usuário dono (mesmo mecanismo do suspend), audit.
//   { action: "delete", accountId, confirmName }
//     -> EXCLUSÃO DEFINITIVA em cascata (filho->pai). Exige confirmName == accounts.name;
//        recusa se algum membro for platform_admin ou o próprio chamador; audit ANTES de apagar.
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
  accountId?: string; confirmName?: string;
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
      subject: "Bem-vindo à maisLEAD — crie sua senha",
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Bem-vindo à maisLEAD</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style>
  @media only screen and (max-width:620px){
    .wrap{width:100%!important;}
    .px{padding-left:24px!important;padding-right:24px!important;}
    .h1{font-size:26px!important;line-height:32px!important;}
    .stepnum{width:34px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f2fb;">
<span style="display:none;font-size:1px;color:#f4f2fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">Sua conta maisLEAD está pronta. Crie sua senha e comece a encontrar leads B2B hoje mesmo.</span>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f2fb;">
<tr><td align="center" style="padding:32px 12px;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 14px rgba(40,25,90,.06);">

    <!-- FAIXA SUPERIOR / LOGO -->
    <tr>
      <td align="center" bgcolor="#4c2ee0" style="background-color:#4c2ee0;padding:34px 40px 30px;" class="px">
        <img src="https://ddndpnibptrvurabacgi.supabase.co/storage/v1/object/public/assets/logo-white-email.png" alt="maisLEAD" width="180" style="display:block;border:0;">
      </td>
    </tr>

    <!-- SAUDAÇÃO -->
    <tr>
      <td style="padding:40px 40px 0;" class="px">
        <div class="h1" style="font-family:Arial,Helvetica,sans-serif;font-size:29px;line-height:36px;mso-line-height-rule:exactly;font-weight:bold;color:#1c1636;letter-spacing:-.4px;">Olá, ${name} 👋</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;mso-line-height-rule:exactly;color:#56526e;padding-top:14px;">
          Sua conta foi criada. Falta só um passo: crie sua senha para acessar e começar a gerar listas de leads qualificados.
        </div>
      </td>
    </tr>

    <!-- BOTÃO -->
    <tr>
      <td align="center" style="padding:28px 40px 10px;" class="px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
          <tr>
            <td align="center" bgcolor="#4c2ee0" style="background-color:#4c2ee0;border-radius:12px;">
              <a href="${link}" style="display:block;padding:17px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;mso-line-height-rule:exactly;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px;">Definir minha senha &nbsp;&rarr;</a>
            </td>
          </tr>
        </table>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;mso-line-height-rule:exactly;color:#6f6a8c;padding-top:12px;">Por segurança, este link é pessoal e tem validade limitada.</div>
      </td>
    </tr>

    <!-- DIVISOR -->
    <tr><td style="padding:26px 40px 0;" class="px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#eceaf6;">&nbsp;</td></tr></table></td></tr>

    <!-- O QUE FAZER PRIMEIRO -->
    <tr>
      <td style="padding:26px 40px 0;" class="px">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;mso-line-height-rule:exactly;font-weight:bold;color:#6f6a8c;letter-spacing:1.2px;text-transform:uppercase;padding-bottom:16px;">Seus primeiros passos</div>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;">
          <tr>
            <td width="40" valign="top" class="stepnum" style="width:40px;padding-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28"><tr><td align="center" width="28" height="28" bgcolor="#efecfd" style="width:28px;height:28px;background-color:#efecfd;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:28px;mso-line-height-rule:exactly;font-weight:bold;color:#4c2ee0;">1</td></tr></table>
            </td>
            <td valign="top" style="padding-bottom:18px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:21px;mso-line-height-rule:exactly;font-weight:bold;color:#1c1636;">Busque no Google Maps</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#56526e;padding-top:3px;">Digite nicho + cidade (ex.: "restaurantes em Curitiba") e receba nome, telefone, site e avaliação.</div>
            </td>
          </tr>
          <tr>
            <td width="40" valign="top" class="stepnum" style="width:40px;padding-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28"><tr><td align="center" width="28" height="28" bgcolor="#efecfd" style="width:28px;height:28px;background-color:#efecfd;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:28px;mso-line-height-rule:exactly;font-weight:bold;color:#4c2ee0;">2</td></tr></table>
            </td>
            <td valign="top" style="padding-bottom:18px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:21px;mso-line-height-rule:exactly;font-weight:bold;color:#1c1636;">Filtre pela base da Receita</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#56526e;padding-top:3px;">Monte listas por CNAE, porte e situação — ou encontre empresas recém-abertas na sua região.</div>
            </td>
          </tr>
          <tr>
            <td width="40" valign="top" class="stepnum" style="width:40px;padding-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28"><tr><td align="center" width="28" height="28" bgcolor="#efecfd" style="width:28px;height:28px;background-color:#efecfd;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:28px;mso-line-height-rule:exactly;font-weight:bold;color:#4c2ee0;">3</td></tr></table>
            </td>
            <td valign="top" style="padding-bottom:18px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:21px;mso-line-height-rule:exactly;font-weight:bold;color:#1c1636;">Trabalhe seus leads no CRM</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#56526e;padding-top:3px;">Cada lead recebe uma pontuação de 0 a 100. Arraste pelo funil, chame no WhatsApp e agende o follow-up.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- DICA -->
    <tr>
      <td style="padding:8px 40px 0;" class="px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:#f7f5ff;border-radius:12px;">
          <tr>
            <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#453f66;">
              <strong style="color:#4c2ee0;">Dica:</strong> preencha o nome da sua empresa no perfil. Ele entra automaticamente nas mensagens de WhatsApp que você dispara para os leads.
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- LINK ALTERNATIVO -->
    <tr>
      <td style="padding:26px 40px 34px;" class="px">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;mso-line-height-rule:exactly;color:#6f6a8c;">
          O botão não funcionou? Copie e cole este endereço no navegador:<br>
          <a href="${link}" style="color:#4c2ee0;text-decoration:underline;word-break:break-all;">${link}</a>
        </div>
      </td>
    </tr>

    <!-- RODAPÉ -->
    <tr>
      <td bgcolor="#faf9fe" style="background-color:#faf9fe;padding:24px 40px 28px;border-top:1px solid #eceaf6;" class="px">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;mso-line-height-rule:exactly;color:#56526e;">
          Precisa de ajuda? Responda este e-mail — a gente lê todas.
        </div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:19px;mso-line-height-rule:exactly;color:#6f6a8c;padding-top:14px;">
          Você recebeu este e-mail porque uma conta maisLEAD foi criada para você.<br>
          maisLEAD — Atlanta, GA<br>
          <a href="https://maislead.com" style="color:#7a74a0;text-decoration:underline;">maislead.com</a> &nbsp;·&nbsp; <a href="mailto:contato@maislead.com?subject=Cancelar%20inscri%C3%A7%C3%A3o" style="color:#7a74a0;text-decoration:underline;">Cancelar inscrição</a>
        </div>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`,
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

    // ============ EXCLUIR CLIENTE (CASCATA) ============
    if (action === "delete") {
      const accountId = (body.accountId ?? "").trim();
      const confirmName = body.confirmName ?? "";
      if (!accountId) return json(400, { error: "missing_account" });

      // conta + nome oficial
      const { data: acc, error: accErr } = await admin
        .from("accounts").select("id, name").eq("id", accountId).maybeSingle();
      if (accErr) return json(500, { error: "delete_failed", step: "load_account", message: accErr.message });
      if (!acc) return json(404, { error: "account_not_found" });

      // (2) proteção anti-acidente: o nome digitado tem que bater exatamente
      if (confirmName.trim() !== (acc.name ?? "").trim()) {
        return json(400, { error: "name_mismatch" });
      }

      // membros da conta (profiles.id == auth user id)
      const { data: members, error: memErr } = await admin
        .from("profiles").select("id").eq("account_id", accountId);
      if (memErr) return json(500, { error: "delete_failed", step: "load_members", message: memErr.message });
      const memberIds = (members ?? []).map((m) => m.id as string);

      // (3) proteção anti-suicídio: não apagar a si mesmo nem um platform_admin
      if (memberIds.includes(user.id)) return json(403, { error: "cannot_delete_admin" });
      if (memberIds.length) {
        const { data: admins } = await admin
          .from("platform_admins").select("user_id").in("user_id", memberIds);
        if (admins && admins.length) return json(403, { error: "cannot_delete_admin" });
      }

      // contagens (para o retorno / auditoria)
      const { count: leadsCount } = await admin
        .from("leads").select("id", { count: "exact", head: true }).eq("account_id", accountId);
      const { count: searchesCount } = await admin
        .from("searches").select("id", { count: "exact", head: true }).eq("account_id", accountId);
      const leads = leadsCount ?? 0;
      const searches = searchesCount ?? 0;

      // (5) registra a auditoria ANTES de apagar qualquer coisa
      await audit("delete_client", accountId, {
        name: acc.name, id: accountId, leads, searches, members: memberIds.length,
      });

      // (4) cascata na ordem filho -> pai. Pára na 1ª etapa que falhar, dizendo qual.
      const step = async (label: string, run: () => Promise<{ error: { message: string } | null }>) => {
        const { error } = await run();
        if (error) throw { step: label, message: error.message };
      };
      const delBy = (table: string, col: string, val: string) =>
        admin.from(table).delete().eq(col, val);

      try {
        // filhos de leads (também ligados por account_id)
        await step("lead_events", () => delBy("lead_events", "account_id", accountId));
        await step("lead_activities", () => delBy("lead_activities", "account_id", accountId));
        await step("lead_documents", () => delBy("lead_documents", "account_id", accountId));
        await step("lead_links", () => delBy("lead_links", "account_id", accountId));
        await step("appointments", () => delBy("appointments", "account_id", accountId));
        // leads (cascateia lead_notes/lead_tags por lead_id) e demais tabelas com account_id
        await step("leads", () => delBy("leads", "account_id", accountId));
        await step("searches", () => delBy("searches", "account_id", accountId));
        await step("email_campaigns", () => delBy("email_campaigns", "account_id", accountId));
        await step("email_templates", () => delBy("email_templates", "account_id", accountId));
        await step("integrations", () => delBy("integrations", "account_id", accountId));
        // ligadas por user_id (sem cascade da account) — limpa órfãos dos membros
        if (memberIds.length) {
          await step("notifications", () => admin.from("notifications").delete().in("user_id", memberIds));
          await step("user_roles", () => admin.from("user_roles").delete().in("user_id", memberIds));
        }
        // profiles antes dos usuários no auth
        await step("profiles", () => delBy("profiles", "account_id", accountId));
        // usuários no auth (um por membro)
        for (const uid of memberIds) {
          const { error: dErr } = await admin.auth.admin.deleteUser(uid);
          if (dErr) throw { step: `auth_user:${uid}`, message: dErr.message };
        }
        // por fim, a própria account (cascade final cobre qualquer resíduo com account_id)
        await step("account", () => delBy("accounts", "id", accountId));
      } catch (e) {
        const err = e as { step?: string; message?: string };
        return json(500, { error: "delete_failed", step: err.step ?? "unknown", message: err.message ?? String(e) });
      }

      return json(200, { ok: true, deleted: { leads, searches, members: memberIds.length } });
    }

    return json(400, { error: "unknown_action" });
  } catch (e) {
    return json(500, { error: "unexpected", message: String((e as Error).message ?? e) });
  }
});
