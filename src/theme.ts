// Tokens do maisLEAD Admin — fiéis ao DESIGN-SPEC-admin.md / maisLEAD Admin A.dc.html.
// Fonte de verdade visual: o .dc.html. Não alterar sem o design.

export const T = {
  // marca
  primary: "#6d5cf5",
  primary2: "#7c5cff",
  primary3: "#8b6bff",
  primary4: "#9d7bff",
  lilac: "#c9b8ff",
  lilacSoft: "#e9e5ff",
  gradLogo: "linear-gradient(135deg,#6d5cf5,#9d7bff)",
  gradBtn: "linear-gradient(135deg,#6d5cf5,#8b6bff)",

  // texto
  text: "#211d3b",
  body: "#615d78",
  muted: "#8f8caa",
  faint: "#a6a3c0",
  section: "#b4b1c8",

  // status
  green: "#10b981",
  greenD: "#059669",
  amber: "#f59e0b",
  amberD: "#c07f0d",
  red: "#f43f5e",
  redD: "#e11d48",
  redD2: "#dc2626",
  avatarPink: "#e8437a",
  avatarOrange: "#e8853a",

  // superfícies
  appBg: "#eceaf6",
  card: "#fff",
  hover: "#faf9fe",
  band: "#f5f5fb",
  line: "#f1f0f8",
  line2: "#f6f5fb",

  // borda / raios / sombras
  border: "#ecebf5",
  radiusCard: 20,
  radiusKpi: 18,
  shadowDrawer: "-20px 0 60px rgba(20,17,40,.2)",
  shadowModal: "0 30px 70px rgba(20,17,40,.35)",
} as const;

export type Screen =
  | "visao"
  | "assinaturas"
  | "clientes"
  | "financeiro"
  | "cadastros"
  | "relatorios"
  | "integracoes";
