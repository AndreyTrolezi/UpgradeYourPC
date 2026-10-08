import { catalog } from "@/app/data/catalog";
import { analyzeBuild, firstPart } from "@/app/lib/compatibility";
import type { BuildConfig, Part } from "@/app/lib/types";

export type AssistantAnswer = { text: string; references: string[]; checks: string[] };
export function answerUpgradeQuestion(question: string, build: BuildConfig, parts: Part[] = catalog): AssistantAnswer {
  const q = question.trim().toLocaleLowerCase("pt-BR");
  if (!q) return { text: "Pergunte sobre compatibilidade, sua configuração ou um upgrade.", references: [], checks: [] };
  const found = parts.filter(p => q.includes(p.name.toLocaleLowerCase("pt-BR")) || q.includes(p.id.toLocaleLowerCase("pt-BR"))).slice(0, 5);
  const checks = analyzeBuild(build, parts).checks;
  const issues = checks.filter(c => c.severity === "error" || c.severity === "warning");
  if (/compat|cabe|funciona|socket|bios|fonte|watts|energia/.test(q)) {
    return { text: issues.length ? "Encontrei alertas na configuração atual. Confira cada um antes de comprar; dados ausentes não comprovam compatibilidade." : "Não encontrei incompatibilidades confirmadas na configuração cadastrada. Isso não substitui verificar BIOS, conectores, medidas oficiais e dados faltantes.", references: found.map(p => p.id), checks: issues.map(c => c.title + ": " + c.detail) };
  }
  if (/meu pc|configura|processador|placa de vídeo|gpu|cpu/.test(q)) {
    const cpu = firstPart(build, "cpu", parts), gpu = firstPart(build, "gpu", parts);
    return { text: `Configuração cadastrada: CPU ${cpu?.name ?? "não informada"}; GPU ${gpu?.name ?? "não informada"}. Para avaliar um upgrade, escolha uma peça e use a simulação de compatibilidade.`, references: [cpu?.id, gpu?.id].filter((id): id is string => !!id), checks: issues.map(c => c.title) };
  }
  return { text: "Esta versão do assistente funciona localmente, sem enviar seus dados a modelos externos. Posso explicar sua configuração e alertas de compatibilidade; pesquisa de preços ao vivo está temporariamente indisponível.", references: found.map(p => p.id), checks: [] };
}
