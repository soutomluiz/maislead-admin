// admin-list-customers — lista de clientes reais do painel superadmin.
// v14: inclui kind/active (cadastro manual), MRR 0 pra contas não-pagantes,
//      e considera a criação da conta como atividade (conta nova nasce "ativa").
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

const PLAN_LABEL: Record<string, string> = { starter: "Starter", pro: "Pro", business: "Business" };
const PLAN_MRR: Record<string, number> = { starter: 49, pro: 149, business: 349 };
const money = (n: number) => "R$ " + n.toLocaleString("pt-BR");

function daysSince(d: string | null): number {
  if (!d) return 9999;
  return (Date.now() - new Date(d).getTime()) / 86400000;
}
function humanizeAgo(d: string | null): string {
  if (!d) return "—";
  const days = Math.floor(daysSince(d));
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}
function humanizeSince(d: string | null): string {
  if (!d) return "—";
  const days = Math.floor(daysSince(d));
  const months = Math.floor(days / 30);
  if (months < 1) return `${days} dias`;
  return months === 1 ? "1 mês" : `${months} meses`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  const { admin } = auth;

  const [{ data: accounts }, { data: profiles }, { data: leads }, { data: searches }, { data: events }, usersRes] =
    await Promise.all([
      admin.from("accounts").select("id,name,plan,billing_cycle,created_at,stripe_customer_id,kind,active,cnpj"),
      admin.from("profiles").select("id,full_name,email,phone,location,industry,account_id,account_role,trial_status,subscription_type"),
      admin.from("leads").select("account_id,created_at"),
      admin.from("searches").select("account_id,created_at"),
      admin.from("lead_events").select("account_id,type,created_at"),
      admin.auth.admin.listUsers(),
    ]);

  const lastSignIn = new Map<string, string>();
  const authEmail = new Map<string, string>();
  for (const u of usersRes.data?.users ?? []) {
    if (u.last_sign_in_at) lastSignIn.set(u.id, u.last_sign_in_at);
    if (u.email) authEmail.set(u.id, u.email);
  }

  const now = Date.now();
  const within30 = (d: string) => now - new Date(d).getTime() <= 30 * 86400000;

  const customers = (accounts ?? []).map((a) => {
    const accProfiles = (profiles ?? []).filter((p) => p.account_id === a.id);
    const owner = accProfiles.find((p) => p.account_role === "admin") ?? accProfiles[0];
    const accLeads = (leads ?? []).filter((l) => l.account_id === a.id);
    const accSearches = (searches ?? []).filter((s) => s.account_id === a.id);
    const accEvents = (events ?? []).filter((e) => e.account_id === a.id);
    const emailsSent = accEvents.filter((e) => (e.type ?? "").toLowerCase().includes("mail") || (e.type ?? "").toLowerCase() === "sent").length;

    const ownerSignIn = owner ? lastSignIn.get(owner.id) ?? null : null;
    const ownerEmail = (owner ? authEmail.get(owner.id) : null) ?? owner?.email ?? "—";
    const activityDates = [
      ...accLeads.map((l) => l.created_at),
      ...accSearches.map((s) => s.created_at),
      ...accEvents.map((e) => e.created_at),
      ownerSignIn,
      a.created_at, // conta recém-criada conta como atividade (não nasce "ociosa")
    ].filter(Boolean) as string[];
    const lastActivity = activityDates.sort().slice(-1)[0] ?? null;

    const leads30 = accLeads.filter((l) => within30(l.created_at)).length;
    const searches30 = accSearches.filter((s) => within30(s.created_at)).length;
    const events30 = accEvents.filter((e) => within30(e.created_at)).length;

    const dSince = daysSince(lastActivity);
    const recency = dSince <= 1 ? 100 : dSince >= 30 ? 0 : Math.round(100 * (1 - (dSince - 1) / 29));
    const volume = Math.min(100, leads30 * 4 + searches30 * 6 + events30 * 1);
    const health = Math.max(1, Math.min(100, Math.round(0.55 * recency + 0.45 * volume)));

    const isTrial = owner?.trial_status === "active" || owner?.subscription_type === "trial";
    const status = isTrial ? "trial" : dSince > 14 ? "ocioso" : "ativo";

    const isManual = !!a.kind; // conta criada manualmente (não-pagante, sem Stripe)
    const planKey = a.plan ?? "starter";
    const mrrNum = isManual || status === "trial" ? 0 : PLAN_MRR[planKey] ?? 0;
    const monthsSince = Math.max(1, Math.floor(daysSince(a.created_at) / 30));
    const name = a.name || owner?.full_name || "Sem nome";

    return {
      id: a.id,
      userId: owner?.id ?? null,
      i: (name[0] || "?").toUpperCase(),
      name,
      city: owner?.location || "—",
      email: ownerEmail,
      phone: owner?.phone || "—",
      industry: owner?.industry || null,
      plan: PLAN_LABEL[planKey] ?? planKey,
      planPrice: money(isManual ? 0 : PLAN_MRR[planKey] ?? 0),
      status,
      health,
      leads: accLeads.length,
      searches: accSearches.length,
      emails: emailsSent,
      lastActive: humanizeAgo(lastActivity),
      since: humanizeSince(a.created_at),
      ltv: money(mrrNum * monthsSince),
      mrr: money(mrrNum),
      createdAt: a.created_at,
      idleDays: Math.min(9999, Math.floor(dSince)),
      kind: a.kind ?? null,
      active: a.active !== false,
    };
  });

  customers.sort((x, y) => y.health - x.health);

  const counts = {
    total: customers.length,
    ativo: customers.filter((c) => c.status === "ativo").length,
    trial: customers.filter((c) => c.status === "trial").length,
    ocioso: customers.filter((c) => c.status === "ocioso").length,
    leadsProcessed: (leads ?? []).length,
  };

  return json(200, { customers, counts });
});
