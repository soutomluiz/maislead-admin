import { useCallback, useEffect, useState } from "react";
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

function Splash({ label }: { label: string }) {
  return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>{label}</div>;
}

function AccessDenied() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: T.appBg, textAlign: "center", padding: 24 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(244,63,94,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.redD} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Acesso restrito</div>
      <div style={{ fontSize: 13.5, color: T.muted, maxWidth: 340 }}>Sua conta não tem permissão de superadmin para acessar este painel.</div>
      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 6, height: 42, padding: "0 22px", borderRadius: 12, border: `1px solid ${T.border}`, background: "#fff", color: T.body, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
        Sair
      </button>
    </div>
  );
}

function Panel() {
  const [screen, setScreen] = useState<Screen>("visao");
  const [checked, setChecked] = useState(false);

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

  const load = useCallback(async (initial: boolean) => {
    try {
      const r = await listCustomers();
      setCustomers(r.customers);
      setLeadsProcessed(r.counts.leadsProcessed);
      setCustError(null);
    } catch (e) {
      setCustError((e as Error).message);
    } finally {
      if (initial) {
        setCustLoading(false);
        setChecked(true);
      }
    }
    try {
      const ir = await getIntegrationsHealth();
      setIntegrations(ir.integrations);
      setIntError(null);
    } catch (e) {
      setIntError((e as Error).message);
    } finally {
      if (initial) setIntLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), 45000); // badge "Ao vivo" — refresh silencioso
    return () => clearInterval(id);
  }, [load]);

  // Gate: enquanto verifica → splash; se não é superadmin → acesso negado.
  if (!checked) return <Splash label="Verificando acesso…" />;
  if (custError === "not_admin") return <AccessDenied />;

  const idle: IdleItem[] = customers
    .filter((c) => c.status === "ocioso")
    .sort((a, b) => b.idleDays - a.idleDays)
    .slice(0, 3)
    .map((c) => ({ i: c.i, name: c.name, sub: `${c.plan} · ${c.planPrice}/mês`, days: `${c.idleDays} dias` }));

  const [title, subtitle] = TITLES[screen];

  // busca global da topbar → filtra clientes e navega
  const onTopSearch = (v: string) => {
    setCliQuery(v);
    if (v && screen !== "clientes") setScreen("clientes");
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: T.appBg, color: T.text, overflow: "hidden", position: "relative" }}>
      <Sidebar screen={screen} onNavigate={setScreen} onLogout={() => supabase.auth.signOut()} />

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar title={title} subtitle={subtitle} search={cliQuery} onSearch={onTopSearch} />
        {/* key={screen}: força remount na troca de módulo → re-dispara a animação de entrada (SPEC §2) */}
        <div key={screen} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 26px" }}>
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
          {screen === "relatorios" && <Relatorios period={period} setPeriod={setPeriod} customers={customers} loading={custLoading} />}
          {screen === "integracoes" && <Integracoes data={integrations} loading={intLoading} error={intError} />}
        </div>
      </main>

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
