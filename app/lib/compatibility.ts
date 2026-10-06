import { catalog } from "@/app/data/catalog";
import type { BuildConfig, CompatibilityCheck, Part, PartCategory } from "@/app/lib/types";

export const getPart = (id?: string, availableParts: Part[] = catalog) => availableParts.find((item) => item.id === id);

export const getBuildParts = (build: BuildConfig, category?: PartCategory, availableParts: Part[] = catalog) => {
  const ids = category
    ? build.parts[category] ?? []
    : Object.values(build.parts).flatMap((value) => value ?? []);
  return ids.map((id) => getPart(id, availableParts)).filter((item): item is Part => Boolean(item));
};

export const firstPart = (build: BuildConfig, category: PartCategory, availableParts: Part[] = catalog) =>
  getPart(build.parts[category]?.[0], availableParts);

const numberSpec = (part: Part | undefined, key: string) => {
  const value = part?.specs[key];
  return typeof value === "number" ? value : 0;
};

const stringSpec = (part: Part | undefined, key: string) => {
  const value = part?.specs[key];
  return typeof value === "string" ? value : "";
};

const listSpec = (part: Part | undefined, key: string) => {
  const value = part?.specs[key];
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
};

export function partPrice(build: BuildConfig, part: Part) {
  const estimate = build.estimatedPrices?.[part.id];
  return typeof estimate === "number" && Number.isFinite(estimate) && estimate > 0 ? estimate : Math.max(0, part.price);
}

export function totalPrice(build: BuildConfig, availableParts: Part[] = catalog) {
  return getBuildParts(build, undefined, availableParts).reduce((sum, item) => sum + partPrice(build, item), 0);
}

export function estimateSystemPower(build: BuildConfig, availableParts: Part[] = catalog) {
  const cpu = firstPart(build, "cpu", availableParts);
  const gpu = firstPart(build, "gpu", availableParts);
  const cpuPeak = numberSpec(cpu, "maxPower") || numberSpec(cpu, "tdp");
  const gpuPeak = numberSpec(gpu, "tgp");
  const storage = getBuildParts(build, "storage", availableParts).length * 8;
  return Math.round(cpuPeak + gpuPeak + storage + 65);
}

export function analyzeBuild(build: BuildConfig, availableParts: Part[] = catalog) {
  const checks: CompatibilityCheck[] = [];
  const unpriced = getBuildParts(build, undefined, availableParts).filter(p => p.priceStatus === "unpriced" && !partPrice(build, p));
  if (unpriced.length) checks.push({ id: "unpriced", severity: "warning", title: "Orçamento incompleto: há peças sem preço", detail: `${unpriced.map(p => p.name).join(", ")}. O total soma apenas os valores conhecidos. Consulte a aba Preços para incluir uma referência.` });
  const oldPrices = Object.entries(build.priceSources ?? {}).filter(([id, s]) => Object.values(build.parts).flat().includes(id) && Date.now() - Date.parse(s.checkedAt) > 86400000);
  if (oldPrices.length) checks.push({ id: "old-market-prices", severity: "info", title: "Há preços de consultas anteriores", detail: "Os valores salvos são um retrato da consulta e não se atualizam sozinhos. Consulte novamente a aba Preços antes de comprar." });
  const cpu = firstPart(build, "cpu", availableParts);
  const board = firstPart(build, "motherboard", availableParts);
  const gpu = firstPart(build, "gpu", availableParts);
  const memory = firstPart(build, "memory", availableParts);
  const psu = firstPart(build, "psu", availableParts);
  const cooler = firstPart(build, "cooler", availableParts);
  const chassis = firstPart(build, "case", availableParts);
  const monitor = firstPart(build, "monitor", availableParts);
  if ((gpu?.source && !numberSpec(gpu, "tgp")) || (cpu?.source && !numberSpec(cpu, "maxPower"))) checks.push({ id: "power-data-incomplete", severity: "info", title: "Consumo estimado com dados parciais", detail: "Faltam dados de consumo máximo para uma peça desta configuração. Confira a fonte recomendada pelo fabricante e o consumo do conjunto antes de comprar." });

  const essentials: PartCategory[] = ["cpu", "motherboard", "memory", "storage", "psu", "cooler", "case"];
  if (!cpu?.specs.igpu) essentials.push("gpu");
  if (cpu && !gpu) checks.push({ id: "display-output", severity: cpu.specs.igpu ? "info" : "error", title: cpu.specs.igpu ? "Usando vídeo integrado" : "Falta uma placa de vídeo", detail: cpu.specs.igpu ? "A GPU integrada compartilha RAM; confira a saída de vídeo da placa-mãe e os requisitos do programa." : "Este processador não gera imagem sem GPU dedicada." });
  const missing = essentials.filter((category) => !(build.parts[category]?.length));
  if (missing.length) {
    checks.push({ id: "missing", severity: "info", title: `${missing.length} categoria${missing.length > 1 ? "s" : ""} sem peça`, detail: "Complete os campos para receber um diagnóstico integral." });
  }

  if (cpu && board) {
    const compatible = stringSpec(cpu, "socket") === stringSpec(board, "socket");
    checks.push({
      id: "socket", severity: compatible ? "ok" : "error", term: "socket",
      title: compatible ? `Socket ${stringSpec(cpu, "socket")} compatível` : "Processador e placa-mãe incompatíveis",
      detail: compatible
        ? `${cpu.name} encaixa na ${board.name}. Ainda pode ser necessário conferir a versão da BIOS.`
        : `${cpu.name} usa ${stringSpec(cpu, "socket")}, enquanto ${board.name} usa ${stringSpec(board, "socket")}.`,
    });
  }

  if (board && memory) {
    const compatible = stringSpec(board, "memoryType") === stringSpec(memory, "memoryType");
    checks.push({
      id: "memory-type", severity: compatible ? "ok" : "error", term: "ddr",
      title: compatible ? `${stringSpec(memory, "memoryType")} compatível` : "Geração de memória incompatível",
      detail: compatible
        ? `${memory.name} corresponde ao padrão aceito pela placa-mãe.`
        : `A placa-mãe usa ${stringSpec(board, "memoryType")}, mas o kit selecionado é ${stringSpec(memory, "memoryType")}.`,
    });
  }

  if (board && chassis) {
    const formats = listSpec(chassis, "formFactors");
    const boardFormat = stringSpec(board, "formFactor");
    const compatible = formats.includes(boardFormat);
    checks.push({
      id: "form-factor", severity: compatible ? "ok" : "error", term: "form-factor",
      title: compatible ? "Placa-mãe cabe no gabinete" : "Formato da placa-mãe não cabe",
      detail: compatible ? `${chassis.name} aceita ${boardFormat}.` : `${chassis.name} aceita ${formats.join(", ") || "formatos não informados"}, não ${boardFormat}.`,
    });
  }

  if (gpu && chassis) {
    const gpuLength = numberSpec(gpu, "length");
    const limit = numberSpec(chassis, "gpuLength");
    const clearance = limit - gpuLength;
    checks.push({
      id: "gpu-length", severity: clearance >= 20 ? "ok" : clearance >= 0 ? "warning" : "error",
      title: clearance >= 20 ? "Espaço adequado para a GPU" : clearance >= 0 ? "GPU cabe com pouca folga" : "GPU longa demais para o gabinete",
      detail: `${gpuLength} mm de placa para ${limit} mm informados no gabinete${clearance >= 0 ? ` — folga de ${clearance} mm.` : "."}`,
    });
  }

  if (cooler && chassis && stringSpec(cooler, "coolerType") !== "AIO") {
    const height = numberSpec(cooler, "height");
    const limit = numberSpec(chassis, "coolerHeight");
    const compatible = height <= limit;
    checks.push({
      id: "cooler-height", severity: compatible ? (limit - height < 4 ? "warning" : "ok") : "error",
      title: compatible ? "Altura do cooler compatível" : "Cooler alto demais para o gabinete",
      detail: `${height} mm de cooler para ${limit} mm de limite informado.`,
    });
  }

  if (cooler && cpu) {
    const sockets = listSpec(cooler, "sockets");
    const socket = stringSpec(cpu, "socket");
    const mounting = sockets.includes(socket);
    const capacity = numberSpec(cooler, "tdpCapacity");
    const peak = numberSpec(cpu, "maxPower") || numberSpec(cpu, "tdp");
    const thermalRatio = capacity / Math.max(1, peak);
    checks.push({
      id: "cooler-socket", severity: mounting ? "ok" : "error", term: "socket",
      title: mounting ? "Kit de montagem compatível" : "Cooler sem suporte ao socket",
      detail: mounting ? `${cooler.name} declara suporte a ${socket}.` : `${cooler.name} não lista ${socket} entre os encaixes.`,
    });
    checks.push({
      id: "cooling", severity: thermalRatio >= 1.25 ? "ok" : thermalRatio >= 1 ? "warning" : "error", term: "tdp",
      title: thermalRatio >= 1.25 ? "Refrigeração com boa margem" : thermalRatio >= 1 ? "Refrigeração no limite estimado" : "Refrigeração insuficiente",
      detail: `Capacidade estimada de ${capacity} W frente a até ~${peak} W do processador. TDP não substitui testes térmicos.`,
    });
  }

  if (psu) {
    const estimated = estimateSystemPower(build, availableParts);
    const wattage = numberSpec(psu, "wattage");
    const gpuRecommendation = numberSpec(gpu, "psuRecommended");
    const headroom = wattage - estimated;
    const enough = wattage >= Math.max(estimated * 1.18, gpuRecommendation);
    checks.push({
      id: "psu-power", severity: enough ? (headroom > wattage * 0.5 ? "info" : "ok") : "error", term: "headroom",
      title: enough ? (headroom > wattage * 0.5 ? "Fonte com bastante folga" : "Potência da fonte adequada") : "Potência da fonte insuficiente",
      detail: `Consumo estimado de ~${estimated} W, fonte de ${wattage} W e recomendação da GPU de ${gpuRecommendation || "—"} W.`,
    });
    const tier = numberSpec(psu, "qualityTier");
    if (tier && tier < 3) {
      checks.push({ id: "psu-quality", severity: "warning", term: "80-plus", title: "Confirme a qualidade elétrica da fonte", detail: "Potência e selo de eficiência não comprovam proteções, estabilidade ou resposta a picos. Consulte testes independentes do modelo exato." });
    }
  }

  if (cpu && gpu && monitor) {
    const pixels = numberSpec(monitor, "pixels") || 2_073_600;
    const refresh = numberSpec(monitor, "refresh") || 60;
    const raster = numberSpec(gpu, "rasterIndex");
    const gaming = numberSpec(cpu, "gamingIndex");
    const resolutionFactor = Math.pow(pixels / 2_073_600, 0.68);
    const refreshFactor = Math.min(2.55, Math.pow(refresh / 60, 0.52));
    const gpuNeed = 88 * resolutionFactor * refreshFactor;
    const cpuNeed = 88 * Math.min(2.05, Math.pow(refresh / 60, 0.38));
    const gpuRatio = raster / gpuNeed;
    const cpuRatio = gaming / cpuNeed;
    const limiting = gpuRatio < cpuRatio ? "GPU" : "CPU";
    const fit = Math.min(gpuRatio, cpuRatio);
    checks.push({
      id: "display-fit", severity: fit >= 1.05 ? "ok" : fit >= 0.78 ? "warning" : "error", term: "bottleneck",
      title: fit >= 1.05 ? "Conjunto coerente para o monitor" : fit >= 0.78 ? "Alvo possível com ajustes" : `${limiting} abaixo da meta selecionada`,
      detail: `${monitor.name}: estimativa baseada em resolução, frequência e índices relativos. O gargalo muda de acordo com jogo e qualidade gráfica.`,
    });
  }

  if (memory) {
    const capacity = numberSpec(memory, "capacity");
    if (capacity < 16) checks.push({ id: "ram-capacity", severity: "error", title: "Pouca memória para um PC atual", detail: `${capacity} GB tende a limitar jogos, navegador e multitarefa.` });
    else if (capacity === 16) checks.push({ id: "ram-capacity", severity: "info", title: "16 GB ainda funciona", detail: "32 GB oferece mais folga para jogos recentes, criação, máquinas virtuais e multitarefa." });
  }

  const scorePenalty = checks.reduce((total, check) => total + (check.severity === "error" ? 24 : check.severity === "warning" ? 9 : 0), 0);
  const completeness = (essentials.length - missing.length) / essentials.length;
  const score = Math.max(0, Math.min(100, Math.round(100 * completeness - scorePenalty)));
  return { checks, score, estimatedPower: estimateSystemPower(build, availableParts), total: totalPrice(build, availableParts), completeness };
}

function isPartCompatibleCandidate(candidate: Part, build: BuildConfig, availableParts: Part[]) {
  const cpu = candidate.category === "cpu" ? candidate : firstPart(build, "cpu", availableParts);
  const board = candidate.category === "motherboard" ? candidate : firstPart(build, "motherboard", availableParts);
  const memory = candidate.category === "memory" ? candidate : firstPart(build, "memory", availableParts);
  const chassis = candidate.category === "case" ? candidate : firstPart(build, "case", availableParts);
  if (cpu && board && stringSpec(cpu, "socket") !== stringSpec(board, "socket")) return false;
  if (board && memory && stringSpec(board, "memoryType") !== stringSpec(memory, "memoryType")) return false;
  if (board && chassis && !listSpec(chassis, "formFactors").includes(stringSpec(board, "formFactor"))) return false;
  return true;
}

export function recommendParts(category: PartCategory, build: BuildConfig, limit = 3, availableParts: Part[] = catalog) {
  const remainingBudget = build.budget > 0 ? Math.max(0, build.budget - totalPrice(build, availableParts) + (firstPart(build, category, availableParts)?.price ?? 0)) : Infinity;
  return availableParts
    .filter((item) => item.category === category && item.priceStatus !== "unpriced" && isPartCompatibleCandidate(item, build, availableParts) && item.price <= remainingBudget)
    .map((item) => {
      let performance = 50;
      if (category === "cpu") performance = build.goal === "work" ? numberSpec(item, "workIndex") : numberSpec(item, "gamingIndex");
      else if (category === "gpu") performance = numberSpec(item, "rasterIndex") * (build.goal === "work" ? 0.65 : 1) + numberSpec(item, "rtIndex") * 0.15;
      else if (category === "memory") performance = numberSpec(item, "capacity") * 2 + numberSpec(item, "speed") / 100;
      else if (category === "storage") performance = numberSpec(item, "capacity") / 20 + numberSpec(item, "read") / 100;
      else if (category === "psu") performance = numberSpec(item, "qualityTier") * 25 + numberSpec(item, "wattage") / 20;
      else performance = item.quality === "excelente" ? 110 : item.quality === "boa" ? 85 : 60;
      const value = item.price > 0 ? performance / item.price : performance;
      return { item, value, performance };
    })
    .sort((a, b) => b.value - a.value || b.performance - a.performance)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function formatSpecValue(value: unknown, unit?: string) {
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
  return String(value);
}
