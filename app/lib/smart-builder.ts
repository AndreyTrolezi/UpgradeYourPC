import { catalog } from "@/app/data/catalog";
import { analyzeBuild, totalPrice } from "@/app/lib/compatibility";
import type { BuildConfig, Part, SmartBrief, RecommendationOption, SmartRecommendation } from "./types";

export function parseBrief(raw: string): SmartBrief {
  const text = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const amount = text.match(/(?:r\$\s*|orcamento\s*(?:de\s*)?|ate\s*|faixa de\s*)(\d[\d.,]*)(?:\s*(mil|k)\b)?/) ?? text.match(/(\d[\d.,]*)\s*(mil|k|reais)\b/);
  const number = amount ? Number(amount[1].replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".")) : 3000;
  const budget = Math.max(300, Math.min(100000, number * (/^(mil|k)$/.test(amount?.[2] ?? "") ? 1000 : 1)));
  const uses = [ [/autocad|\bcad\b/, "CAD"], [/sketchup|\b3d\b|blender|render|revit/, "3D"], [/jog|gamer|fps|valorant|forza/, "Jogos"], [/edit|premiere|davinci/, "Edição"], [/program|codigo|desenvolv/, "Programação"] ] as const;
  return { raw, budget, device: /notebook|laptop/.test(text) && !/ou|tanto faz/.test(text) ? "notebook" : /desktop|apenas pc|so pc/.test(text) ? "desktop" : "either", newOnly: !/usad/.test(text), uses: uses.filter(([re]) => re.test(text)).map(([,name]) => name), minimumRam: Number(text.match(/(16|32|64)\s*gb\s*(?:de\s*)?(?:ram|memoria)/)?.[1] ?? 16), dedicatedGpu: /dedicada|render pesado|3d pesado|jogos pesados/.test(text), includeMonitor: /com monitor|inclu[ai]r monitor/.test(text), wifi: /wi.?fi/.test(text) };
}

const n = (part: Part, key: string) => Number(part.specs[key]) || 0;
export function recommendBuild(brief: SmartBrief): SmartRecommendation {
  // Installed zero-price items must never subsidize an all-new build.
  const priced = catalog.filter(p => p.price > 0 && !p.tags.includes("atual"));
  const by = (category: Part["category"]) => priced.filter(p => p.category === category).sort((a,b) => a.price-b.price);
  const candidates: RecommendationOption[] = [];
  for (const cpu of by("cpu")) {
    if (n(cpu,"cores") < 4) continue;
    const board = by("motherboard").find(p => p.specs.socket === cpu.specs.socket && (!brief.wifi || p.specs.wifi) && (n(cpu,"maxPower") <= 100 || n(p,"vrmTier") >= 4));
    if (!board) continue;
    const memory = by("memory").find(p => p.specs.memoryType === board.specs.memoryType && n(p,"capacity") >= brief.minimumRam);
    const storage = by("storage").find(p => n(p,"capacity") >= 500);
    if (!memory || !storage) continue;
    const stock = catalog.find(p => p.id === "cooler-wraith-stealth" && cpu.brand === "AMD" && cpu.specs.coolerIncluded && n(cpu,"maxPower") <= 90);
    const cooler = stock ?? by("cooler").find(p => Array.isArray(p.specs.sockets) && p.specs.sockets.includes(String(cpu.specs.socket)) && n(p,"tdpCapacity") >= n(cpu,"maxPower"));
    if (!cooler) continue;
    const graphics: Array<Part | undefined> = [...(cpu.specs.igpu && !brief.dedicatedGpu ? [undefined] : []), ...by("gpu")];
    for (const gpu of graphics) {
      const psu = by("psu").find(p => n(p,"qualityTier") >= 3 && n(p,"wattage") >= Math.max(gpu ? n(gpu,"psuRecommended") : 350, (n(cpu,"maxPower") + (gpu ? n(gpu,"tgp") : 0) + 80) * 1.25));
      const chassis = by("case").find(p => p.id !== "case-office-matx" && Array.isArray(p.specs.formFactors) && p.specs.formFactors.includes(String(board.specs.formFactor)) && n(p,"coolerHeight") >= n(cooler,"height") && (!gpu || n(p,"gpuLength") >= n(gpu,"length") + 15));
      if (!psu || !chassis) continue;
      const build: BuildConfig = { id: `smart-${cpu.id}-${gpu?.id ?? "igpu"}`, name: `PC para ${brief.uses.join(" + ") || "uso diário"}`, goal: brief.uses.includes("Jogos") ? "games" : "work", budget: brief.budget, notes: "Simulação com preços-base estimados, sem disponibilidade confirmada. Não inclui frete, montagem, periféricos ou licenças. Validar BIOS e requisitos da versão dos programas antes da compra.", parts: { cpu:[cpu.id], motherboard:[board.id], memory:[memory.id], storage:[storage.id], cooler:[cooler.id], psu:[psu.id], case:[chassis.id], ...(gpu ? {gpu:[gpu.id]} : {}), ...(brief.includeMonitor ? {monitor:["monitor-lg-24-75"]} : {}) } };
      if (analyzeBuild(build).checks.some(c => c.severity === "error")) continue;
      const total = totalPrice(build);
      const graph = gpu ? n(gpu,"rasterIndex") : /8600g/.test(cpu.id) ? 55 : /[46]600g|5600g|5600gt|5700g/.test(cpu.id) ? 28 : 8;
      const score = n(cpu, brief.uses.includes("Jogos") ? "gamingIndex" : "workIndex") + graph * (brief.uses.some(u => ["3D","Jogos","Edição"].includes(u)) ? 1.4 : .15);
      candidates.push({id:build.id,kind:"desktop",title:cpu.name,subtitle:gpu?.name ?? "Vídeo integrado • sem GPU dedicada",total,score,fit:total <= brief.budget ? "dentro" : total <= brief.budget*1.15 ? "próximo" : "acima",build,reasons:[`${n(memory,"capacity")} GB em dual channel`,`${n(storage,"capacity")} GB de SSD`,"Encaixes e potência verificados pelas regras do catálogo"],warnings:[...(!gpu && brief.uses.some(u=>["CAD","3D","Jogos","Edição"].includes(u)) ? ["Alternativa de entrada: não garante fluidez em 3D complexo, renderização ou jogos exigentes."] : []),"Preços-base são estimativas, não cotações atuais. Confirme estoque novo e BIOS."]});
    }
  }
  candidates.sort((a,b) => a.total-b.total);
  const within = candidates.filter(c=>c.total<=brief.budget).sort((a,b)=>b.score-a.score || a.total-b.total);
  const primary = within[0] ?? candidates[0];
  if (!primary) throw new Error("Não há combinação no catálogo para essas restrições. Tente retirar Wi-Fi obrigatório ou reduzir a RAM.");
  const different = within.find(c=>c.build?.parts.cpu?.[0] !== primary.build?.parts.cpu?.[0]);
  const next = candidates.find(c=>c.total>brief.budget && c.score>primary.score);
  return {mode:"local",brief,primary,alternatives:[different,next].filter((v):v is RecommendationOption=>Boolean(v)),generatedAt:new Date().toISOString(),summary: brief.device === "notebook" ? "O catálogo de notebooks ainda não está conectado. Esta é uma referência de desktop, não um notebook equivalente." : within.length ? "Melhor pontuação estimada entre as combinações do catálogo que cabem no orçamento de peças." : "Não encontrei um PC completo no orçamento. Abaixo está a combinação mais barata disponível no catálogo, acima do limite."};
}
