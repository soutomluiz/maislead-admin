// Tipos de dados do painel. Os arrays de exemplo (clientes/assinaturas/custos fictícios)
// foram REMOVIDOS — o painel agora só mostra dados reais das edge functions admin-*,
// e estados vazios honestos onde ainda não há fonte (billing/Stripe).
// Estes tipos permanecem porque são usados pela tela de Assinaturas e por lib/api.ts.

export type SubStatus = "ativo" | "trial" | "inad";
export type PayStatus = "pago" | "pend" | "falhou";
export type HistStatus = "pago" | "falhou";
export type CliStatus = "ativo" | "trial" | "ocioso";
export type SignupStatus = "emtrial" | "convertido";

export interface PaymentHist {
  date: string;
  val: string;
  status: HistStatus;
}

export interface Sub {
  i: string;
  name: string;
  city: string;
  email: string;
  cnpj: string;
  plan: string;
  cycle: string;
  status: SubStatus;
  mrr: string;
  start: string;
  next: string;
  method: string;
  since: string;
  ltv: string;
  trialDays?: number;
  dunning?: number;
  hist: PaymentHist[];
}

export interface Client {
  i: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  plan: string;
  status: CliStatus;
  health: number;
  leads: number;
  searches: number;
  emails: number;
  lastActive: string;
  since: string;
  ltv: string;
  mrr: string;
}
