import type { BuildConfig, Part, PartCategory, SpecValue } from "@/app/lib/types";

export const detectedCategories = ["cpu", "motherboard", "gpu", "memory", "storage", "monitor"] as const;
export type DetectedCategory = typeof detectedCategories[number];
export type DetectedComponent = { category: DetectedCategory; name: string; manufacturer: string; partNumber?: string; specs: Record<string, SpecValue> };
export type DetectorReport = { kind: "UpgradePCDetector"; schemaVersion: 1; detectorVersion: string; scannedAt: string; components: DetectedComponent[]; warnings: string[] };
export type ImportChoice = { include: boolean; target: string; name: string; confirmed: boolean; primaryGpu?: boolean };
const allowedSpecs: Record<DetectedCategory, Record<string, "number" | "string">> = {
  cpu: { cores: "number", threads: "number" }, motherboard: {}, gpu: {},
  memory: { capacity: "number", modules: "number", speed: "number", memoryType: "string" },
  storage: { capacity: "number", interface: "string" }, monitor: {},
};
const clean = (value: unknown, limit = 160) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit) : "";

export function parseDetectorReport(raw: string): DetectorReport {
  if (raw.length > 1_000_000) throw Error("O relatório excede o limite de 1 MB.");
  let data;
  try { data = JSON.parse(raw.replace(/^\uFEFF/, "")); } catch { throw Error("Esse arquivo não contém um JSON válido do Detector."); }
  if (!data || data.kind !== "UpgradePCDetector" || data.schemaVersion !== 1 || !Array.isArray(data.components) || !data.components.length || data.components.length > 100) throw Error("Formato não reconhecido. Use o arquivo gerado pelo UpgradePC Detector v1.");
  const components: DetectedComponent[] = data.components.map((item: unknown) => {
    if (!item || typeof item !== "object") throw Error("O relatório contém um item inválido.");
    const row = item as Record<string, unknown>;
    if (!detectedCategories.includes(row.category as DetectedCategory) || !clean(row.name)) throw Error("O relatório contém uma categoria ou nome inválido.");
    const category = row.category as DetectedCategory;
    const original = row.specs && typeof row.specs === "object" && !Array.isArray(row.specs) ? row.specs as Record<string, unknown> : {};
    const specs: Record<string, SpecValue> = {};
    for (const [key, type] of Object.entries(allowedSpecs[category])) {
      const value = original[key];
      if (type === "number" && typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 10_000_000) specs[key] = value;
      if (type === "string" && clean(value, 80)) specs[key] = clean(value, 80);
    }
    if (category === "memory") specs.modules = 1; // CIM reports physical modules, not retail kits.
    return { category, name: clean(row.name), manufacturer: clean(row.manufacturer, 80), partNumber: clean(row.partNumber, 100) || undefined, specs };
  });
  return { kind: "UpgradePCDetector", schemaVersion: 1, detectorVersion: clean(data.detectorVersion, 30) || "1", scannedAt: typeof data.scannedAt === "string" && Number.isFinite(Date.parse(data.scannedAt)) ? data.scannedAt : "", components, warnings: Array.isArray(data.warnings) ? data.warnings.slice(0, 20).map((w: unknown) => clean(w, 220)).filter(Boolean) : [] };
}

const normalize = (value: string) => value.toLowerCase().replace(/\(r\)|\(tm\)|®|™/g, "").replace(/[^a-z0-9]/g, "");
function cpuIdentity(name: string) {
  const stripped = name.replace(/\(r\)|\(tm\)|®|™/gi, "");
  const match = stripped.match(/ryzen\s+[3579]\s+\d{4,5}\s*(?:x3d|xt|x|g|f)?\b/i) ?? stripped.match(/\bi[3579][-\s]*\d{4,5}[a-z]{0,3}\b/i);
  return match ? normalize(match[0]) : normalize(stripped);
}
export function detectorCandidates(component: DetectedComponent, parts: Part[]) {
  return parts.filter(part => {
    if (part.category !== component.category) return false;
    if (component.category === "memory") return part.specs.modules === 1 && part.specs.capacity === component.specs.capacity && (!component.specs.memoryType || part.specs.memoryType === component.specs.memoryType);
    return true;
  });
}
export function suggestedPart(component: DetectedComponent, parts: Part[]): string | null {
  // GPU names from Windows do not identify the board partner, VRAM variant or cooler.
  if (component.category === "gpu" || component.category === "memory") return null;
  const matches = detectorCandidates(component, parts).filter(p => component.category === "cpu" ? cpuIdentity(p.name) === cpuIdentity(component.name) : normalize(p.name) === normalize(component.name) && normalize(p.brand) === normalize(component.manufacturer));
  return matches.length === 1 ? matches[0].id : null;
}
export function initialImportChoices(report: DetectorReport, parts: Part[]): ImportChoice[] {
  return report.components.map(c => ({ include: true, target: suggestedPart(c, parts) ?? "detected", name: c.name, confirmed: false }));
}
function hash(value: string) { let h = 2166136261; for (const c of value) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

export function applyDetectorImport(build: BuildConfig, customParts: Part[], report: DetectorReport, choices: ImportChoice[], catalog: Part[]): { build: BuildConfig; customParts: Part[] } {
  if (choices.length !== report.components.length) throw Error("Revise todos os itens do relatório.");
  const next = structuredClone(build), added = structuredClone(customParts);
  const replacements: Partial<Record<PartCategory, string[]>> = {};
  let primaryGpu: string | undefined;
  report.components.forEach((component, index) => {
    const choice = choices[index];
    if (!choice.include) return;
    if (!choice.confirmed || !clean(choice.name)) throw Error("Confirme o modelo de cada item incluído antes de aplicar.");
    let id = choice.target;
    if (id === "detected") {
      const name = clean(choice.name);
      const fingerprint = JSON.stringify([component.category, name, component.manufacturer, component.partNumber, component.specs]);
      id = `custom-detector-${component.category}-${hash(fingerprint)}`;
      const known = added.find(p => p.id === id);
      if (known && (known.name !== name || JSON.stringify(known.specs) !== JSON.stringify(component.specs))) id += `-${crypto.randomUUID()}`;
      if (!added.some(p => p.id === id)) added.push({ id, category: component.category, brand: component.manufacturer || "Não identificado", name, price: 0, priceStatus: "unpriced", summary: "Detectado no Windows e revisado na importação. Especificações ausentes precisam ser completadas.", tags: ["personalizada", "detectada"], quality: "não avaliada", qualityNote: "Informações do Windows não certificam o modelo comercial, a qualidade ou a compatibilidade completa.", specs: { ...component.specs } });
    } else if (!detectorCandidates(component, [...catalog, ...added]).some(p => p.id === id)) throw Error("Um modelo escolhido não corresponde ao tipo ou à capacidade do item detectado.");
    (replacements[component.category] ??= []).push(id);
    if (component.category === "gpu" && choice.primaryGpu) primaryGpu = id;
  });
  if (!Object.keys(replacements).length) throw Error("Escolha pelo menos uma peça para importar.");
  if ((replacements.cpu?.length ?? 0) > 1 || (replacements.motherboard?.length ?? 0) > 1) throw Error("Esta versão do Meu PC aceita uma CPU e uma placa-mãe. Selecione os itens principais.");
  if (added.length > 300) throw Error("O catálogo pessoal atingiu o limite de 300 peças.");
  if ((replacements.gpu?.length ?? 0) > 1) {
    if (!primaryGpu) throw Error("Escolha o adaptador de vídeo principal para o diagnóstico.");
    const index = replacements.gpu!.indexOf(primaryGpu);
    replacements.gpu!.splice(index, 1);
    replacements.gpu!.unshift(primaryGpu);
  }
  next.parts = { ...next.parts, ...replacements };
  next.isExample = false;
  return { build: next, customParts: added };
}
