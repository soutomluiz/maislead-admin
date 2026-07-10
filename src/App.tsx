import { useState } from "react";
import { T, type Screen } from "./theme";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SubscriptionDrawer } from "./components/SubscriptionDrawer";
import { CustomerDrawer } from "./components/CustomerDrawer";
import { VisaoGeral } from "./screens/VisaoGeral";
import { Assinaturas, type SubFilter } from "./screens/Assinaturas";
import { Clientes, type CliFilter } from "./screens/Clientes";
import { Financeiro } from "./screens/Financeiro";
import { Cadastros } from "./screens/Cadastros";
import { Relatorios, type Period } from "./screens/Relatorios";
import { Integracoes } from "./screens/Integracoes";
import type { Client, Sub } from "./data/mock";

const TITLES: Record<Screen, [string, string]> = {
  visao: ["Visão Geral", "Julho 2025 · atualizado agora"],
  assinaturas: ["Assinaturas", "342 ativas · 8 em trial · 6 inadimplentes"],
  clientes: ["Clientes", "429 clientes cadastrados"],
  financeiro: ["Financeiro", "Receitas, custos e contas da plataforma"],
  cadastros: ["Cadastros", "87 novos cadastros no mês"],
  relatorios: ["Relatórios", "Análises e exportações"],
  integracoes: ["Integrações", "5 de 6 serviços operacionais"],
};

export function App() {
  const [screen, setScreen] = useState<Screen>("visao");

  // Assinaturas
  const [subFilter, setSubFilter] = useState<SubFilter>("todas");
  const [subQuery, setSubQuery] = useState("");
  const [openSub, setOpenSub] = useState<Sub | null>(null);

  // Clientes
  const [cliFilter, setCliFilter] = useState<CliFilter>("todos");
  const [cliQuery, setCliQuery] = useState("");
  const [openCli, setOpenCli] = useState<Client | null>(null);

  // Relatórios
  const [period, setPeriod] = useState<Period>("30d");

  const [title, subtitle] = TITLES[screen];

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: T.appBg,
        color: T.text,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Sidebar screen={screen} onNavigate={setScreen} />

      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar title={title} subtitle={subtitle} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 26px" }}>
          {screen === "visao" && <VisaoGeral onNavigate={setScreen} />}
          {screen === "assinaturas" && (
            <Assinaturas
              filter={subFilter}
              setFilter={setSubFilter}
              query={subQuery}
              setQuery={setSubQuery}
              onOpen={setOpenSub}
            />
          )}
          {screen === "clientes" && (
            <Clientes
              filter={cliFilter}
              setFilter={setCliFilter}
              query={cliQuery}
              setQuery={setCliQuery}
              onOpen={setOpenCli}
            />
          )}
          {screen === "financeiro" && <Financeiro />}
          {screen === "cadastros" && <Cadastros />}
          {screen === "relatorios" && <Relatorios period={period} setPeriod={setPeriod} />}
          {screen === "integracoes" && <Integracoes />}
        </div>
      </main>

      {/* drawers (overlay sobre toda a raiz) */}
      {openSub && <SubscriptionDrawer sub={openSub} onClose={() => setOpenSub(null)} />}
      {openCli && <CustomerDrawer client={openCli} onClose={() => setOpenCli(null)} />}
    </div>
  );
}
