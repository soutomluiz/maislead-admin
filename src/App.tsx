import { useState } from "react";
import { T, type Screen } from "./theme";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { VisaoGeral } from "./screens/VisaoGeral";

const TITLES: Record<Screen, [string, string]> = {
  visao: ["Visão Geral", "Julho 2025 · atualizado agora"],
  assinaturas: ["Assinaturas", "342 ativas · 8 em trial · 6 inadimplentes"],
  clientes: ["Clientes", "429 clientes cadastrados"],
  financeiro: ["Financeiro", "Receitas, custos e contas da plataforma"],
  cadastros: ["Cadastros", "87 novos cadastros no mês"],
  relatorios: ["Relatórios", "Análises e exportações"],
  integracoes: ["Integrações", "5 de 6 serviços operacionais"],
};

function Soon({ label }: { label: string }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.faint,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {label} — em construção
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>("visao");
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
          {screen === "visao" ? <VisaoGeral onNavigate={setScreen} /> : <Soon label={title} />}
        </div>
      </main>
    </div>
  );
}
