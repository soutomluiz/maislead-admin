import { supabase } from "./supabase";
import type { Client } from "../data/mock";

// Cliente real vindo da edge function admin-list-customers (superset de Client).
export interface RealCustomer extends Client {
  id: string;
}

export interface CustomerCounts {
  total: number;
  ativo: number;
  trial: number;
  ocioso: number;
  leadsProcessed: number;
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
