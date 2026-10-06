export const partCategories = [
  "cpu",
  "motherboard",
  "gpu",
  "memory",
  "storage",
  "psu",
  "cooler",
  "case",
  "monitor",
] as const;

export type PartCategory = (typeof partCategories)[number];

export type SpecValue = string | number | boolean | string[];

export type Part = {
  id: string;
  category: PartCategory;
  brand: string;
  name: string;
  price: number;
  priceStatus?: "unpriced";
  source?: { url: string; checkedAt: string };
  marketMatch?: string[];
  year?: number;
  platform?: string;
  summary: string;
  tags: string[];
  quality: "excelente" | "boa" | "básica" | "atenção" | "não avaliada";
  qualityNote: string;
  specs: Record<string, SpecValue>;
};

export type BuildGoal = "games" | "balanced" | "work";

export type BuildConfig = {
  id: string;
  name: string;
  parts: Partial<Record<PartCategory, string[]>>;
  goal: BuildGoal;
  budget: number;
  notes: string;
  applications?: string;
  isExample?: boolean;
  estimatedPrices?: Record<string, number>;
  priceSources?: Record<string, { checkedAt: string; sampleSize: number; method: "mean" | "median" }>;
};

export type DevicePreference = "desktop" | "notebook" | "either";
export type PcHistoryEntry = { id: string; build: BuildConfig; createdAt: string };

export type SmartBrief = {
  budget: number;
  device: DevicePreference;
  newOnly: boolean;
  uses: string[];
  minimumRam: number;
  dedicatedGpu: boolean;
  includeMonitor: boolean;
  wifi: boolean;
  raw: string;
};

export type Notebook = {
  id: string;
  brand: string;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: number;
  storage: number;
  screen: string;
  performanceIndex: number;
  dedicatedGpu: boolean;
  upgradeableRam: boolean;
  summary: string;
  goodFor: string[];
  cautions: string[];
};

export type RecommendationOption = {
  id: string;
  kind: "desktop" | "notebook";
  title: string;
  subtitle: string;
  total: number;
  score: number;
  fit: "dentro" | "próximo" | "acima";
  build?: BuildConfig;
  notebook?: Notebook;
  reasons: string[];
  warnings: string[];
};

export type SmartRecommendation = {
  mode: "local" | "online";
  brief: SmartBrief;
  summary: string;
  primary: RecommendationOption;
  alternatives: RecommendationOption[];
  generatedAt: string;
};

export type MarketOffer = {
  title: string;
  storeId: string;
  store: string;
  price: number;
  shipping: number | null;
  url: string;
  payment: string;
  condition: "não informado" | "anunciado novo";
  inSample: boolean;
};

export type MarketSnapshot = {
  partId: string;
  partName: string;
  mode: "online";
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  sampleSize: number;
  offers: MarketOffer[];
  checkedAt: string;
  expiresAt: string;
  excluded: number;
  partial: boolean;
  note: string;
};

export type CouponSnapshot = {
  storeId: string;
  checkedAt: string;
  expiresAt: string;
  coupons: Array<{ code: string; description: string; url: string; sourceInfo: string }>;
  pages: Array<{ title: string; url: string }>;
};

export type UserProfile = {
  displayName: string;
  location: string;
  currentBuild: BuildConfig;
  draftBuild: BuildConfig;
  pricePreference: "cash" | "installments";
  trustedOnly: boolean;
  customParts: Part[];
  offers: Offer[];
};

export type SavedBuild = {
  id: string;
  name: string;
  payload: BuildConfig;
  createdAt: string;
  updatedAt: string;
};

export type GlossaryTerm = {
  id: string;
  name: string;
  short: string;
  practical: string;
  affects: string[];
  category: string;
};

export type CheckSeverity = "ok" | "warning" | "error" | "info";

export type CompatibilityCheck = {
  id: string;
  severity: CheckSeverity;
  title: string;
  detail: string;
  term?: string;
};

export type PluginPermission =
  | "catalog.read"
  | "build.read"
  | "build.write"
  | "compatibility.extend"
  | "glossary.extend"
  | "export.extend"
  | "prices.read"
  | "network.request";

export type ExtensionManifest = {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: PluginPermission[];
  homepage?: string;
  builtIn?: boolean;
  enabled?: boolean;
  contributions?: {
    glossary?: GlossaryTerm[];
    parts?: Part[];
    badges?: Array<{ label: string; color: string }>;
  };
};

export type StoredExtension = {
  pluginId: string;
  manifest: ExtensionManifest;
  enabled: boolean;
  installedAt: string;
};

export type Offer = {
  id: string;
  partId: string;
  store: string;
  seller: string;
  priceCash: number;
  priceInstallments: number;
  shipping: number;
  url: string;
  condition: "novo" | "usado" | "recondicionado";
  sellerType: "loja" | "oficial" | "marketplace";
  invoice: boolean;
  nationalWarranty: boolean;
  trustScore: number;
  checkedAt: string;
};
