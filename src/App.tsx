import { useEffect, useState } from "react";
import { T, type Screen } from "./theme";
import { supabase } from "./lib/supabase";
import { listCustomers, getIntegrationsHealth, type RealCustomer, type IntegrationHealth } from "./lib/api";
import { AuthGate } from "./auth/AuthGate";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SubscriptionDrawer } from "./components/SubscriptionDrawer";
import { CustomerDrawer } from "./components/CustomerDrawer";
import { VisaoGeral, type IdleItem } from "./screens/VisaoGeral";
import { Assinaturas, type SubFilter } from "./screens/Assinaturas";
import { Clientes, type CliFilter } from "./screens/Clientes";
import { Financeiro } from "./screens/Financeiro";
import { Cadastros } from "./screens/Cadastros";
import { Relatorios, type Period } from "./screens/Relatorios";
import { Integracoes } from "./screens/Integracoes";
import type { Sub } from "./data/mock";

const TITLES: Record<Screen, [string, string]> = {
  visao: ["Visão Geral", "Julho 2025 · atualizado agora"],
  assinaturas: ["Assinaturas", "342 ativas · 8 em trial · 6 inadimplentes"],
  clientes: ["Clientes", "Contas reais da plataforma"],
  financeiro: ["Financeiro", "Receitas, custos e contas da plataforma"],
  cadastros: ["Cadastros", "Novos cadastros da plataforma"],
  relatorios: ["Relatórios", "Análises e exportações"],
  integracoes: ["Integrações", "Status ao vivo dos serviços"],
};

export function App() {
  return <AuthGate>{() => <Panel />}</AuthGate>;
}

function Panel() {
  const [screen, setScreen] = useState<Screen>("visao");

  // Assinaturas (mock — depende do Stripe)
  const [subFilter, setSubFilter] = useState<SubFilter>("todas");
  const [subQuery, setSubQuery] = useState("");
  const [openSub, setOpenSub] = useState<Sub | null>(null);

  // Clientes (dados reais)
  const [cliFilter, setCliFilter] = useState<CliFilter>("todos");
  const [cliQuery, setCliQuery] = useState("");
  const [openCli, setOpenCli] = useState<RealCustomer | null>(null);
  const [customers, setCustomers] = useState<RealCustomer[]>([]);
  const [custLoading, setCustLoading] = useState(true);
  const [custError, setCustError] = useState<string | null>(null);
  const [leadsProcessed, setLeadsProcessed] = useState<number | null>(null);

  // Integrações (healthcheck real)
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [intLoading, setIntLoading] = useState(true);
  const [intError, setIntError] = useState<string | null>(null);

  // Relatórios (mock)
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    listCustomers()
      .then((r) => {
        setCustomers(r.customers);
        setLeadsProcessed(r.counts.leadsProcessed);
      })
      .catch((e) => setCustError(e.message))
      .finally(() => setCustLoading(false));

    getIntegrationsHealth()
      .then((r) => setIntegrations(r.integrations))
      .catch((e) => setIntError(e.message))
      .finally(() => setIntLoading(false));
  }, []);

  // ociosos reais para a Visão Geral
  const idle: IdleItem[] = customers
    .filter((c) => c.status === "ocioso")
    .sort((a, b) => b.idleDays - a.idleDays)
    .slice(0, 3)
    .map((c) => ({ i: c.i, name: c.name, sub: `${c.plan} · ${c.planPrice}/mês`, days: `${c.idleDays} dias` }));

  const [title, subtitle] = TITLES[screen];

  return (
    <div style={{ height: "100vh", display: "flex", background: T.appBg, color: T.text, overflow: "hidden", position: "relative" }}>
      <Sidebar screen={screen} onNavigate={setScreen} onLogout={() => supabase.auth.signOut()} />

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar title={title} subtitle={subtitle} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 26px" }}>
          {screen === "visao" && <VisaoGeral onNavigate={setScreen} leadsProcessed={leadsProcessed} idle={idle} />}
          {screen === "assinaturas" && (
            <Assinaturas filter={subFilter} setFilter={setSubFilter} query={subQuery} setQuery={setSubQuery} onOpen={setOpenSub} />
          )}
          {screen === "clientes" && (
            <Clientes
              data={customers}
              loading={custLoading}
              error={custError}
              leadsProcessed={leadsProcessed}
              filter={cliFilter}
              setFilter={setCliFilter}
              query={cliQuery}
              setQuery={setCliQuery}
              onOpen={setOpenCli}
            />
          )}
          {screen === "financeiro" && <Financeiro />}
          {screen === "cadastros" && <Cadastros customers={customers} loading={custLoading} error={custError} />}
          {screen === "relatorios" && <Relatorios period={period} setPeriod={setPeriod} />}
          {screen === "integracoes" && <Integracoes data={integrations} loading={intLoading} error={intError} />}
        </div>
      </main>

      {/* drawers (overlay sobre toda a raiz) */}
      {openSub && <SubscriptionDrawer sub={openSub} onClose={() => setOpenSub(null)} />}
      {openCli && (
        <CustomerDrawer
          client={openCli}
          onClose={() => setOpenCli(null)}
          onViewSub={() => {
            setOpenCli(null);
            setScreen("assinaturas");
          }}
        />
      )}
    </div>
  );
}
