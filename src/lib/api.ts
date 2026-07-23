import { supabase } from "./supabase";
import type { Client } from "../data/mock";

// Tipo de conta criada manualmente pelo admin (não-pagante, sem Stripe).
export type ClientKind = "tester" | "cortesia" | "parceiro" | "interno";

// Cliente real vindo da edge function admin-list-customers (superset de Client).
export interface RealCustomer extends Client {
  id: string;
  userId: string | null;
  industry: string | null;
  planPrice: string;
  createdAt: string;
  idleDays: number;
  kind: ClientKind | null; // null = conta normal (pagante)
  active: boolean;
}

export interface CustomerCounts {
  total: number;
  ativo: number;
  trial: number;
  ocioso: number;
  leadsProcessed: number;
}

export interface IntegrationHealth {
  icon: string;
  bg: string;
  name: string;
  desc: string;
  status: string;
  dot: string;
  statusCol: string;
  info: string;
}

/** Lê o erro real de uma FunctionsHttpError (o corpo JSON do 4xx/5xx). */
async function readFnError(error: unknown): Promise<string> {
  const e = error as { message?: string; context?: { json?: () => Promise<{ error?: string }> } };
  try {
    const body = await e.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* ignore */
  }
  return e.message ?? "unknown_error";
}

export async function listCustomers(): Promise<{ customers: RealCustomer[]; counts: CustomerCounts }> {
  const { data, error } = await supabase.functions.invoke("admin-list-customers", { body: {} });
  if (error) throw new Error(await readFnError(error));
  return data as { customers: RealCustomer[]; counts: CustomerCounts };
}

export async function getIntegrationsHealth(): Promise<{ integrations: IntegrationHealth[]; operational: number; total: number }> {
  const { data, error } = await supabase.functions.invoke("admin-integrations-health", { body: {} });
  if (error) throw new Error(await readFnError(error));
  return data as { integrations: IntegrationHealth[]; operational: number; total: number };
}

// POST /api/admin/clients → edge function admin-clients {action:"create"}
export interface NewClientPayload {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  cnpj?: string;
  plan: "starter" | "pro" | "business";
  kind: ClientKind;
  sendInvite: boolean;
  password?: string;
  active: boolean;
}

export async function createManualClient(
  payload: NewClientPayload,
): Promise<{ ok: boolean; inviteSent: boolean; inviteLink: string | null; customer: RealCustomer }> {
  const { data, error } = await supabase.functions.invoke("admin-clients", { body: { action: "create", ...payload } });
  if (error) throw new Error(await readFnError(error));
  return data as { ok: boolean; inviteSent: boolean; inviteLink: string | null; customer: RealCustomer };
}

// PATCH /api/admin/clients/:id/active → edge function admin-clients {action:"set_active"}
export async function setClientActive(accountId: string, active: boolean): Promise<void> {
  const { data, error } = await supabase.functions.invoke("admin-clients", { body: { action: "set_active", accountId, active } });
  if (error) throw new Error(await readFnError(error));
  if (!(data as { ok?: boolean })?.ok) throw new Error("update_failed");
}

export async function customerAction(
  action: "impersonate" | "suspend" | "unsuspend",
  args: { accountId?: string; userId?: string | null; email?: string },
): Promise<{ ok: boolean; link?: string | null }> {
  const { data, error } = await supabase.functions.invoke("admin-customer-action", {
    body: { action, ...args },
  });
  if (error) throw new Error(await readFnError(error));
  return data as { ok: boolean; link?: string | null };
}
