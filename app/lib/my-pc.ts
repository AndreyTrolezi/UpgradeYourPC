import { partCategories, type BuildConfig, type Part, type PartCategory } from "@/app/lib/types";

export type PcCheck = { id: string; status: "ok" | "attention" | "pending"; title: string; detail: string; term?: string };
export const multipleSlots = (category: PartCategory) => ["memory", "storage", "monitor"].includes(category);

export function changePcPart(build: BuildConfig, category: PartCategory, index: number, id: string | null): BuildConfig {
  const next = structuredClone(build);
  const ids = [...(next.parts[category] ?? [])];
  if (id === null) ids.splice(index, 1); else ids[index] = id;
  next.parts[category] = ids.filter(Boolean);
  return next;
}

export function changedCategories(a: BuildConfig, b: BuildConfig) {
  return partCategories.filter(category => JSON.stringify(a.parts[category] ?? []) !== JSON.stringify(b.parts[category] ?? []));
}

const text = (p: Part | undefined, key: string) => typeof p?.specs[key] === "string" ? String(p.specs[key]) : undefined;
const number = (p: Part | undefined, key: string) => typeof p?.specs[key] === "number" && Number(p.specs[key]) > 0 ? Number(p.specs[key]) : undefined;
const list = (p: Part | undefined, key: string) => Array.isArray(p?.specs[key]) ? p!.specs[key] as string[] : text(p, key) ? [text(p, key)!] : [];

export function diagnosePc(build: BuildConfig, parts: Part[]): PcCheck[] {
  const checks: PcCheck[] = [];
  const get = (category: PartCategory) => (build.parts[category] ?? []).map(id => parts.find(p => p.id === id && p.category === category)).filter((p): p is Part => !!p);
  const cpu = get("cpu")[0], board = get("motherboard")[0], gpu = get("gpu")[0], cooler = get("cooler")[0], chassis = get("case")[0], psu = get("psu")[0];
  const memory = get("memory");
  const add = (id: string, status: PcCheck["status"], title: string, detail: string, term?: string) => checks.push({ id, status, title, detail, term });
  const socket = text(cpu, "socket"), boardSocket = text(board, "socket");
  if (!socket || !boardSocket) add("socket", "pending", "Socket por verificar", "Informe o processador e a placa-mãe com seus sockets para conferir o encaixe.", "socket");
  else add("socket", socket === boardSocket ? "ok" : "attention", socket === boardSocket ? `Socket ${socket}: encaixe compatível` : "Sockets diferentes", `${cpu!.name}: ${socket}. ${board!.name}: ${boardSocket}. O mesmo socket não garante suporte pela BIOS.`, "socket");
  if (cpu && board) add("bios", "pending", "Confirme o suporte da BIOS", "Consulte a lista de CPUs suportadas para o modelo e a revisão exatos da placa-mãe. Esta verificação não consulta a BIOS instalada.", "bios");
  const boardDdr = text(board, "memoryType");
  const incompatibleRam = memory.filter(p => text(p, "memoryType") && ((boardDdr && text(p, "memoryType") !== boardDdr) || (list(cpu, "memoryType").length && !list(cpu, "memoryType").includes(text(p, "memoryType")!))));
  if (incompatibleRam.length) add("ram", "attention", "Geração de RAM incompatível", `${incompatibleRam.map(p => p.name).join(", ")} não corresponde à memória suportada pela placa-mãe ou pelo processador.`, "ddr");
  else if (boardDdr && memory.length && memory.every(p => text(p, "memoryType"))) add("ram", "ok", `Memória ${boardDdr} e placa-mãe correspondem`, "Confira também a lista de módulos testados, a frequência e o perfil de memória suportado.", "ddr");
  else add("ram", "pending", "Geração da RAM por verificar", "Complete as especificações da placa-mãe e de cada kit de memória.", "ddr");
  if (memory.length) {
    const modules = memory.map(p => number(p, "modules")), slots = number(board, "memorySlots");
    const capacity = memory.map(p => number(p, "capacity")), maximum = number(board, "maxMemory");
    if (slots && modules.every(Boolean)) {
      const total = modules.reduce<number>((sum, value) => sum + value!, 0);
      add("slots", total > slots ? "attention" : "ok", `${total} módulos para ${slots} slots`, "A quantidade considera todos os kits cadastrados, inclusive modelos repetidos.");
    } else add("slots", "pending", "Quantidade de módulos por verificar", "Informe os módulos de cada kit e o número de slots da placa-mãe.");
    if (maximum && capacity.every(Boolean)) {
      const total = capacity.reduce<number>((sum, value) => sum + value!, 0);
      add("capacity", total > maximum ? "attention" : "ok", `${total} GB de RAM · limite informado: ${maximum} GB`, "A capacidade de cada kit é o total do kit, não a capacidade de um único módulo.");
    }
  }
  if (!gpu) add("video", cpu?.specs.igpu === true ? "ok" : cpu?.specs.igpu === false ? "attention" : "pending", cpu?.specs.igpu === true ? "Processador com vídeo integrado" : "Saída de vídeo por verificar", cpu?.specs.igpu === false ? "Este processador precisa de uma placa de vídeo dedicada para gerar imagem." : "Confirme as saídas da placa-mãe e a conexão com seu monitor.");
  const form = text(board, "formFactor"), formats = list(chassis, "formFactors");
  if (form && formats.length) add("form", formats.includes(form) ? "ok" : "attention", formats.includes(form) ? "Formato da placa-mãe aceito" : "Formato fora do suporte do gabinete", `${form} · gabinete: ${formats.join(", ")}.`, "form-factor");
  else add("form", "pending", "Encaixe no gabinete por verificar", "Informe o formato da placa-mãe e os formatos aceitos pelo gabinete.");
  if (gpu) {
    const length = number(gpu, "length"), limit = number(chassis, "gpuLength");
    if (length && limit) add("gpu-length", length <= limit ? "ok" : "attention", length <= limit ? "Comprimento da GPU dentro do limite" : "GPU maior que o espaço informado", `${length} mm · limite do gabinete: ${limit} mm. Radiadores e ventoinhas podem reduzir esse espaço.`);
    else add("gpu-length", "pending", "Espaço para a GPU por verificar", "Falta o comprimento da placa ou o limite do gabinete.");
  }
  if (cooler && socket && list(cooler, "sockets").length) add("cooler", list(cooler, "sockets").includes(socket) ? "ok" : "attention", list(cooler, "sockets").includes(socket) ? "Fixação do cooler compatível" : "Fixação do cooler incompatível", "Confira se o kit de montagem para o socket acompanha esta unidade. Encaixe não garante capacidade de refrigeração.");
  else add("cooler", "pending", "Refrigeração por verificar", cpu?.specs.coolerIncluded === true ? "O processador pode vir com cooler na versão em caixa. Cadastre o cooler efetivamente instalado para validar a montagem." : "Cadastre o cooler e seus sockets suportados.");
  const height = number(cooler, "height"), heightLimit = number(chassis, "coolerHeight");
  if (height && heightLimit) add("cooler-height", height <= heightLimit ? "ok" : "attention", height <= heightLimit ? "Altura do cooler dentro do limite" : "Cooler mais alto que o espaço informado", `${height} mm · limite do gabinete: ${heightLimit} mm.`);
  const watts = number(psu, "wattage"), recommended = number(gpu, "psuRecommended");
  add("power", watts && recommended && watts < recommended ? "attention" : "pending", watts && recommended && watts < recommended ? "Fonte abaixo da referência da GPU" : "Alimentação exige conferência", watts && recommended ? `Fonte: ${watts} W; recomendação informada para a GPU: ${recommended} W. Confira conectores, qualidade e consumo de todo o sistema.` : "A potência nominal isolada não valida a fonte. Confira conectores, qualidade e consumo do conjunto.", "tdp");
  const missing = partCategories.filter(category => !get(category).length);
  if (missing.length) add("incomplete", "pending", `${missing.length} categorias sem peça identificada`, "Você pode cadastrar aos poucos. Peças desconhecidas ou ausentes não recebem uma aprovação automática.");
  return checks;
}
