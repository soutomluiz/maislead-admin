// Placeholder inicial — substituído pela shell real (sidebar 240px + topbar + 7 telas)
// nos próximos commits. Existe só para o primeiro deploy do Netlify ter conteúdo.
export function App() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#eceaf6",
        color: "#211d3b",
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "linear-gradient(135deg,#6d5cf5,#9d7bff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize: 30,
          boxShadow: "0 12px 30px rgba(109,92,245,.35)",
        }}
      >
        m
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>maisLEAD</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8f8caa", letterSpacing: ".08em" }}>
          SUPERADMIN
        </div>
      </div>
      <div style={{ fontSize: 13.5, color: "#8f8caa" }}>Painel em construção…</div>
    </div>
  );
}
