// Mock portado 1:1 do maisLEAD Admin A.dc.html (bloco <script>).
// Na Fase 2 estes arrays são substituídos por dados reais das edge functions admin-*.

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

export const subsRaw: Sub[] = [
  { i: "P", name: "Padaria Pão Quente", city: "São Paulo, SP", email: "contato@paoquente.com.br", cnpj: "12.345.678/0001-90", plan: "Pro", cycle: "Mensal", status: "ativo", mrr: "R$ 149", start: "12/03/25", next: "12/08/25", method: "Cartão •••• 4242", since: "4 meses", ltv: "R$ 596", hist: [{ date: "12/07/25", val: "R$ 149", status: "pago" }, { date: "12/06/25", val: "R$ 149", status: "pago" }, { date: "12/05/25", val: "R$ 149", status: "pago" }, { date: "12/04/25", val: "R$ 149", status: "pago" }] },
  { i: "A", name: "Auto Center Silva", city: "Campinas, SP", email: "financeiro@autosilva.com", cnpj: "23.456.789/0001-01", plan: "Business", cycle: "Anual", status: "ativo", mrr: "R$ 349", start: "08/01/25", next: "08/01/26", method: "Boleto", since: "6 meses", ltv: "R$ 2.094", hist: [{ date: "08/01/25", val: "R$ 4.188", status: "pago" }] },
  { i: "S", name: "Studio Bella Estética", city: "Rio de Janeiro, RJ", email: "bella@studiobella.com", cnpj: "34.567.890/0001-12", plan: "Starter", cycle: "Mensal", status: "trial", mrr: "R$ 0", start: "01/07/25", next: "15/07/25", method: "—", since: "12 dias", ltv: "R$ 0", trialDays: 3, hist: [] },
  { i: "C", name: "Contabilidade Prisma", city: "Belo Horizonte, MG", email: "contato@prismacont.com.br", cnpj: "45.678.901/0001-23", plan: "Pro", cycle: "Mensal", status: "ativo", mrr: "R$ 149", start: "20/02/25", next: "20/08/25", method: "Cartão •••• 8815", since: "5 meses", ltv: "R$ 745", hist: [{ date: "20/07/25", val: "R$ 149", status: "pago" }, { date: "20/06/25", val: "R$ 149", status: "pago" }, { date: "20/05/25", val: "R$ 149", status: "pago" }] },
  { i: "I", name: "Imobiliária Horizonte", city: "Curitiba, PR", email: "adm@imobhorizonte.com.br", cnpj: "56.789.012/0001-34", plan: "Business", cycle: "Mensal", status: "ativo", mrr: "R$ 349", start: "03/11/24", next: "03/08/25", method: "Cartão •••• 1190", since: "8 meses", ltv: "R$ 2.792", hist: [{ date: "03/07/25", val: "R$ 349", status: "pago" }, { date: "03/06/25", val: "R$ 349", status: "pago" }, { date: "03/05/25", val: "R$ 349", status: "pago" }] },
  { i: "L", name: "Loja Central Modas", city: "Salvador, BA", email: "central@lojamodas.com", cnpj: "67.890.123/0001-45", plan: "Business", cycle: "Mensal", status: "inad", mrr: "R$ 349", start: "15/04/25", next: "15/07/25", method: "Cartão •••• 3320", since: "3 meses", ltv: "R$ 1.047", trialDays: 0, dunning: 2, hist: [{ date: "15/07/25", val: "R$ 349", status: "falhou" }, { date: "15/06/25", val: "R$ 349", status: "pago" }, { date: "15/05/25", val: "R$ 349", status: "pago" }] },
  { i: "M", name: "Mercado Bom Preço", city: "Fortaleza, CE", email: "gerencia@bompreco.com", cnpj: "78.901.234/0001-56", plan: "Business", cycle: "Mensal", status: "ativo", mrr: "R$ 349", start: "22/05/25", next: "22/08/25", method: "Cartão •••• 7781", since: "5 meses", ltv: "R$ 1.745", hist: [{ date: "22/07/25", val: "R$ 349", status: "pago" }, { date: "22/06/25", val: "R$ 349", status: "pago" }] },
  { i: "R", name: "Restaurante Sabor & Cia", city: "Porto Alegre, RS", email: "sabor@saborecia.com", cnpj: "89.012.345/0001-67", plan: "Pro", cycle: "Mensal", status: "inad", mrr: "R$ 149", start: "09/06/25", next: "09/07/25", method: "Cartão •••• 5567", since: "1 mês", ltv: "R$ 149", trialDays: 0, dunning: 1, hist: [{ date: "09/07/25", val: "R$ 149", status: "falhou" }, { date: "09/06/25", val: "R$ 149", status: "pago" }] },
];

export const topClients = [
  { rank: "1", i: "I", name: "Imobiliária Horizonte", plan: "Business", since: "8 meses", total: "R$ 2.792" },
  { rank: "2", i: "A", name: "Auto Center Silva", plan: "Business", since: "6 meses", total: "R$ 2.094" },
  { rank: "3", i: "M", name: "Mercado Bom Preço", plan: "Business", since: "5 meses", total: "R$ 1.745" },
  { rank: "4", i: "C", name: "Contabilidade Prisma", plan: "Pro", since: "5 meses", total: "R$ 745" },
  { rank: "5", i: "P", name: "Padaria Pão Quente", plan: "Pro", since: "4 meses", total: "R$ 596" },
];

export const segments = [
  { name: "Comércio / Varejo", pct: 31, color: "#6d5cf5" },
  { name: "Serviços / Saúde", pct: 24, color: "#9d7bff" },
  { name: "Automotivo", pct: 18, color: "#b79dff" },
  { name: "Imobiliário", pct: 15, color: "#c9b8ff" },
  { name: "Outros", pct: 12, color: "#e0d6ff" },
];

export const clientsRaw: Client[] = [
  { i: "I", name: "Imobiliária Horizonte", city: "Curitiba, PR", email: "adm@imobhorizonte.com.br", phone: "(41) 99812-3344", plan: "Business", status: "ativo", health: 92, leads: 1240, searches: 86, emails: 3200, lastActive: "há 2 horas", since: "8 meses", ltv: "R$ 2.792", mrr: "R$ 349" },
  { i: "A", name: "Auto Center Silva", city: "Campinas, SP", email: "financeiro@autosilva.com", phone: "(19) 99745-1120", plan: "Business", status: "ativo", health: 88, leads: 980, searches: 64, emails: 2100, lastActive: "há 5 horas", since: "6 meses", ltv: "R$ 2.094", mrr: "R$ 349" },
  { i: "M", name: "Mercado Bom Preço", city: "Fortaleza, CE", email: "gerencia@bompreco.com", phone: "(85) 99688-7712", plan: "Business", status: "ativo", health: 81, leads: 760, searches: 52, emails: 1450, lastActive: "ontem", since: "5 meses", ltv: "R$ 1.745", mrr: "R$ 349" },
  { i: "C", name: "Contabilidade Prisma", city: "Belo Horizonte, MG", email: "contato@prismacont.com.br", phone: "(31) 99534-9080", plan: "Pro", status: "ativo", health: 76, leads: 540, searches: 41, emails: 890, lastActive: "há 1 dia", since: "5 meses", ltv: "R$ 745", mrr: "R$ 149" },
  { i: "P", name: "Padaria Pão Quente", city: "São Paulo, SP", email: "contato@paoquente.com.br", phone: "(11) 99123-4567", plan: "Pro", status: "ativo", health: 68, leads: 410, searches: 33, emails: 620, lastActive: "há 3 dias", since: "4 meses", ltv: "R$ 596", mrr: "R$ 149" },
  { i: "S", name: "Studio Bella Estética", city: "Rio de Janeiro, RJ", email: "bella@studiobella.com", phone: "(21) 99456-2211", plan: "Starter", status: "trial", health: 54, leads: 120, searches: 14, emails: 80, lastActive: "há 4 horas", since: "12 dias", ltv: "R$ 0", mrr: "R$ 0" },
  { i: "D", name: "Dental Care Sorriso", city: "Recife, PE", email: "contato@dentalsorriso.com", phone: "(81) 99321-4455", plan: "Pro", status: "ocioso", health: 28, leads: 60, searches: 4, emails: 20, lastActive: "há 18 dias", since: "3 meses", ltv: "R$ 447", mrr: "R$ 149" },
  { i: "T", name: "TransLog Cargas", city: "Goiânia, GO", email: "operacao@translog.com.br", phone: "(62) 99770-8899", plan: "Business", status: "ocioso", health: 22, leads: 35, searches: 2, emails: 0, lastActive: "há 26 dias", since: "4 meses", ltv: "R$ 1.396", mrr: "R$ 349" },
];

export const costs = [
  { icon: "🗄️", bg: "#e9e5ff", name: "Hospedagem / Infra (AWS)", cat: "Servidores + banco de dados", val: "R$ 4.200", pct: "75%" },
  { icon: "📍", bg: "#e0f2fe", name: "Google Places API", cat: "Busca de leads", val: "R$ 5.800", pct: "100%" },
  { icon: "💳", bg: "#dcfce7", name: "Stripe (taxas)", cat: "Processamento de pagamentos", val: "R$ 2.110", pct: "38%" },
  { icon: "✉️", bg: "#fef3c7", name: "SendGrid", cat: "Disparo de e-mails", val: "R$ 680", pct: "14%" },
  { icon: "🏢", bg: "#f3e8ff", name: "ReceitaWS (CNPJ)", cat: "Enriquecimento de dados", val: "R$ 390", pct: "8%" },
  { icon: "👥", bg: "#fee2e2", name: "Equipe & Ferramentas", cat: "Suporte + softwares", val: "R$ 5.500", pct: "98%" },
];

export const payments: { i: string; name: string; plan: string; val: string; method: string; date: string; status: PayStatus }[] = [
  { i: "I", name: "Imobiliária Horizonte", plan: "Business", val: "R$ 349", method: "Cartão", date: "03/07", status: "pago" },
  { i: "A", name: "Auto Center Silva", plan: "Business", val: "R$ 349", method: "Cartão", date: "08/07", status: "pago" },
  { i: "P", name: "Padaria Pão Quente", plan: "Pro", val: "R$ 149", method: "Pix", date: "12/07", status: "pago" },
  { i: "C", name: "Contabilidade Prisma", plan: "Pro", val: "R$ 149", method: "Boleto", date: "20/07", status: "pend" },
  { i: "L", name: "Loja Central Modas", plan: "Business", val: "R$ 349", method: "Cartão", date: "15/07", status: "falhou" },
];

export const dunning = [
  { i: "L", bg: "#fde8f0", color: "#e8437a", name: "Loja Central Modas", reason: "Business · cartão recusado", val: "R$ 349", attempt: "2ª tentativa", attemptColor: "#c07f0d" },
  { i: "R", bg: "#e9e5ff", color: "#6d5cf5", name: "Restaurante Sabor & Cia", reason: "Pro · saldo insuficiente", val: "R$ 149", attempt: "1ª tentativa", attemptColor: "#c07f0d" },
  { i: "O", bg: "#fef0e6", color: "#e8853a", name: "Ótica Visão Clara", reason: "Pro · cartão expirado", val: "R$ 149", attempt: "3ª tentativa", attemptColor: "#f43f5e" },
];

export const signups: { i: string; name: string; email: string; origin: string; plan: string; date: string; status: SignupStatus }[] = [
  { i: "S", name: "Studio Bella Estética", email: "contato@studiobella.com", origin: "Orgânico", plan: "Starter", date: "01/07", status: "emtrial" },
  { i: "T", name: "TechFix Assistência", email: "ola@techfix.com.br", origin: "Google Ads", plan: "Pro", date: "02/07", status: "convertido" },
  { i: "F", name: "Floricultura Bela Flor", email: "flor@belaflor.com", origin: "Indicação", plan: "Starter", date: "03/07", status: "emtrial" },
  { i: "G", name: "Gráfica Rápida Print", email: "print@rapida.com", origin: "Orgânico", plan: "Pro", date: "04/07", status: "convertido" },
  { i: "P", name: "Pet Shop Amigo Fiel", email: "contato@amigofiel.com", origin: "Instagram", plan: "Starter", date: "05/07", status: "emtrial" },
  { i: "D", name: "Distribuidora União", email: "vendas@uniao.com.br", origin: "Google Ads", plan: "Business", date: "06/07", status: "convertido" },
];

export const cohortRaw: { label: string; cells: (number | null)[] }[] = [
  { label: "Jan", cells: [100, 86, 79, 74, 71, 68] },
  { label: "Fev", cells: [100, 88, 81, 77, 73, null] },
  { label: "Mar", cells: [100, 89, 83, 79, null, null] },
  { label: "Abr", cells: [100, 91, 85, null, null, null] },
  { label: "Mai", cells: [100, 90, null, null, null, null] },
  { label: "Jun", cells: [100, null, null, null, null, null] },
];

export const revenueByPlan = [
  { name: "Business", val: "R$ 20,0k", pct: 95, color: "#6d5cf5" },
  { name: "Pro", val: "R$ 21,0k", pct: 100, color: "#9d7bff" },
  { name: "Starter", val: "R$ 7,2k", pct: 34, color: "#c9b8ff" },
];

export const integrations = [
  { icon: "📍", bg: "#e0f2fe", name: "Google Places API", desc: "Busca e enriquecimento de leads", dot: "#10b981", status: "Operacional", statusCol: "#059669", uptime: "100%" },
  { icon: "💳", bg: "#dcfce7", name: "Stripe", desc: "Cobrança e assinaturas", dot: "#10b981", status: "Operacional", statusCol: "#059669", uptime: "100%" },
  { icon: "✉️", bg: "#fef3c7", name: "SendGrid", desc: "Envio de e-mails em massa", dot: "#10b981", status: "Operacional", statusCol: "#059669", uptime: "99,8%" },
  { icon: "🏢", bg: "#f3e8ff", name: "ReceitaWS (CNPJ)", desc: "Consulta de dados cadastrais", dot: "#f59e0b", status: "Degradado", statusCol: "#c07f0d", uptime: "94,2%" },
  { icon: "🔗", bg: "#e9e5ff", name: "Webhooks CRM", desc: "Sincronização com CRMs externos", dot: "#10b981", status: "Operacional", statusCol: "#059669", uptime: "99,9%" },
  { icon: "💬", bg: "#dcfce7", name: "WhatsApp Business", desc: "Disparo e atendimento", dot: "#10b981", status: "Operacional", statusCol: "#059669", uptime: "99,5%" },
];
