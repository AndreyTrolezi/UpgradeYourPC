import type { Part } from "@/app/lib/types";

export const chipName = (part: Part) => part.category === "gpu" ? part.name.match(/(?:RTX|GTX|RX)\s*\d{3,4}(?:\s*(?:Ti|Super|XTX|XT))?\b|Arc\s*[AB]\d{3}\b/i)?.[0].replace(/\s+/g, " ") ?? part.name : part.name;
export function partIdentity(part: Part) {
  const chip = chipName(part);
  const vendor = part.category === "gpu" ? String(part.specs.gpuVendor ?? "Não informado") : part.brand;
  const isModel = part.category !== "gpu" || Boolean(part.source && part.marketMatch && part.name !== chip);
  return { chip, vendor, isModel, family: part.category === "gpu" ? `${vendor}:${chip.toLowerCase().replace(/\s/g, "")}:${part.specs.vram ?? "?"}` : part.id };
}

const qualityPosition = {
  excelente: "topo / construção reforçada",
  boa: "intermediário / equilibrado",
  básica: "entrada / essencial",
  atenção: "exige análise cuidadosa",
  "não avaliada": "ainda não avaliado",
} as const;

export function partHierarchy(part: Part) {
  const s = part.specs;
  const identity = partIdentity(part);
  const platform = part.category === "cpu" ? `${s.socket ?? "socket não informado"} · ${s.architecture ?? "arquitetura não informada"}`
    : part.category === "gpu" ? `${identity.vendor} · ${identity.chip} · ${s.vram ?? "?"} GB`
    : part.category === "motherboard" ? `${s.socket ?? "socket não informado"} · ${s.chipset ?? "chipset não informado"}`
    : part.category === "memory" ? `${s.memoryType ?? "geração não informada"} · ${s.capacity ?? "?"} GB`
    : part.category === "storage" ? `${s.interface ?? "interface não informada"} · ${s.formFactor ?? "formato não informado"}`
    : part.category === "psu" ? `${s.wattage ?? "?"} W · ${s.atxVersion ?? "padrão ATX não informado"}`
    : part.category === "cooler" ? `${s.coolerType ?? "tipo não informado"} · ${Array.isArray(s.sockets) ? s.sockets.join(" / ") : "encaixe não informado"}`
    : part.category === "case" ? `${Array.isArray(s.formFactors) ? s.formFactors.join(" / ") : "formato não informado"}`
    : `${s.resolution ?? "resolução não informada"} · ${s.refresh ?? "?"} Hz`;
  const exactModel = part.category === "cpu" || (part.category === "gpu" ? identity.isModel : Boolean(part.source && part.marketMatch));
  const exactness = exactModel ? "Modelo exato identificado" : part.category === "gpu" ? "Chip e fabricante identificados; variante comercial pendente" : "Modelo cadastrado; revisão ou SKU ainda não verificado";
  const constructionBasis = typeof s.vrmTier === "number" ? `VRM nível ${s.vrmTier}/5 no catálogo`
    : typeof s.qualityTier === "number" ? `qualidade elétrica nível ${s.qualityTier}/5 no catálogo`
    : "classificação editorial do catálogo";
  return {
    exactModel,
    exactness,
    position: qualityPosition[part.quality],
    constructionBasis,
    levels: [
      { label: "Categoria", value: part.category === "gpu" ? "Placa de vídeo" : part.category === "cpu" ? "Processador" : part.category === "motherboard" ? "Placa-mãe" : "Componente" },
      { label: "Plataforma / base", value: platform },
      { label: "Fabricante", value: part.brand },
      { label: "Modelo", value: part.name },
    ],
  };
}

export function usageTags(part: Part): string[] {
  const tags = new Set<string>();
  if (["cpu", "gpu", "memory", "storage", "monitor"].includes(part.category)) tags.add("Uso geral");
  // These describe use cases to investigate, never a benchmark or an application certification.
  if (["cpu", "gpu", "monitor"].includes(part.category)) tags.add("Jogos");
  if (["cpu", "gpu", "memory", "storage"].includes(part.category)) tags.add("Trabalho e criação");
  if (["motherboard", "psu", "cooler", "case"].includes(part.category)) tags.add("Montagem e expansão");
  return [...tags];
}

export function partAnalysis(part: Part) {
  const s = part.specs;
  const strengths: string[] = [], cautions: string[] = [];
  const facts = (value: unknown) => value !== undefined && value !== "";
  let audience = "Para quem precisa completar ou atualizar o computador, conferindo o modelo exato e suas conexões.";
  let performance = "As especificações descrevem os recursos da peça. Elas não medem, sozinhas, a experiência no computador inteiro.";
  if (part.category === "cpu") {
    if (facts(s.cores) && facts(s.threads)) strengths.push(`${s.cores} núcleos e ${s.threads} threads disponíveis para dividir tarefas. O ganho depende de o programa aproveitar esse paralelismo.`);
    if (facts(s.socket)) strengths.push(`Plataforma ${s.socket}: permite avaliar a troca junto da placa-mãe e da RAM já instaladas.`);
    if (facts(s.l3)) strengths.push(`${s.l3} MB de cache L3 informados. Compare esse dado entre os modelos exatos: nomes próximos não significam o mesmo projeto ou desempenho.`);
    if (s.igpu === true) strengths.push("Possui vídeo integrado. Confira o modelo gráfico e as exigências dos programas antes de dispensar uma GPU dedicada.");
    if (s.igpu === false) cautions.push("Precisa de placa de vídeo dedicada para gerar imagem.");
    cautions.push("Socket igual não garante suporte: a revisão da placa-mãe e a versão da BIOS também importam.");
    if (s.coolerIncluded === false) cautions.push("A ficha não inclui cooler: considere a refrigeração no custo da montagem.");
    audience = "Para quem quer atualizar a capacidade de processamento. Jogos, renderização e multitarefa devem ser avaliados separadamente.";
    performance = "Núcleos, cache e clock ajudam a entender o projeto, mas não se convertem diretamente em FPS. Compare testes do mesmo programa, com a mesma GPU, RAM e configurações. Mais núcleos podem ajudar cargas paralelas; não garantem maior desempenho em jogos.";
  } else if (part.category === "gpu") {
    if (facts(s.vram)) strengths.push(`${s.vram} GB de VRAM informados. A capacidade ajuda a avaliar o espaço para texturas e projetos, mas não mede a velocidade do chip.`);
    if (partIdentity(part).isModel && facts(s.length)) strengths.push(`${s.length} mm de comprimento declarados para este modelo: uma medida útil para conferir o gabinete.`);
    if (facts(s.powerConnector)) strengths.push(`Alimentação declarada: ${s.powerConnector}. Confira os cabos disponíveis na fonte.`);
    cautions.push("Mesmo chip pode aparecer em modelos com refrigeração, dimensões, limites de potência e garantia diferentes.");
    if (!partIdentity(part).isModel) cautions.push("O modelo comercial completo ainda não está identificado. Medidas, ruído e construção de uma variante não podem ser atribuídos a todas.");
    audience = "Para quem usa jogos ou programas acelerados por GPU. Escolha considerando resolução, recursos exigidos e consumo do conjunto.";
    performance = "Desempenho em rasterização, ray tracing e criação são coisas diferentes. Upscaling e geração de quadros precisam aparecer separados dos testes nativos. A VRAM isolada não define qual placa é mais rápida.";
  } else if (part.category === "motherboard") {
    if (facts(s.socket) && facts(s.memoryType)) strengths.push(`Base ${s.socket} com memória ${s.memoryType}. É o ponto de partida para conferir CPU e RAM.`);
    if (facts(s.memorySlots)) strengths.push(`${s.memorySlots} slots de memória informados para planejar a ocupação e a expansão.`);
    if (s.biosFlashback === true) strengths.push("A ficha informa atualização de BIOS por recurso dedicado; confira o procedimento do fabricante.");
    cautions.push("Confira a revisão exata, a lista de CPUs suportadas e o compartilhamento de pistas/portas.");
    audience = "Para quem precisa de uma base compatível com o processador, a memória e as conexões pretendidas.";
    performance = "A placa-mãe não adiciona FPS por si só. Alimentação, BIOS e limites térmicos podem afetar quanto tempo o processador sustenta seu desempenho.";
  } else if (part.category === "memory") {
    if (facts(s.capacity)) strengths.push(`${s.capacity} GB de capacidade total deste item${s.modules ? `, distribuídos em ${s.modules} módulo(s)` : ""}.`);
    if (facts(s.memoryType)) strengths.push(`Padrão ${s.memoryType} identificado para conferir o encaixe.`);
    cautions.push("Não misture gerações DDR. Velocidade de perfil XMP/EXPO depende de suporte e configuração; kits misturados podem exigir ajustes.");
    audience = "Para quem precisa de capacidade para programas e multitarefa, respeitando slots e limite da placa-mãe.";
    performance = "Capacidade, frequência, latência e número de canais atuam juntos. Mais GB ajudam quando falta memória; não significam ganho automático de FPS.";
  } else if (part.category === "storage") {
    if (facts(s.capacity)) strengths.push(`${s.capacity} GB nominais de capacidade informada.`);
    if (facts(s.interface)) strengths.push(`Interface ${s.interface}; confira a conexão disponível no computador.`);
    cautions.push("Velocidade sequencial máxima não representa todas as cargas. Cache, temperatura e tipo de memória alteram o desempenho sustentado.");
    audience = "Para quem precisa de espaço ou quer melhorar carregamentos, com slot e formato compatíveis.";
    performance = "Leitura sequencial, acessos pequenos e gravações longas precisam de testes distintos. Um SSD mais rápido não aumenta automaticamente o FPS médio.";
  } else if (part.category === "psu") {
    if (facts(s.wattage)) strengths.push(`${s.wattage} W nominais informados para começar o dimensionamento.`);
    cautions.push("Potência e selo de eficiência não comprovam qualidade elétrica. Procure testes do modelo exato, proteções e conectores.");
    performance = "Aqui o foco é estabilidade, eficiência e resposta a cargas. Não há ganho de FPS mensurável a partir da potência nominal.";
  } else if (part.category === "cooler") {
    if (Array.isArray(s.sockets)) strengths.push(`Fixação informada para ${s.sockets.join(", ")}. Confira o kit incluído.`);
    cautions.push("Capacidade térmica anunciada não é padronizada entre fabricantes. Compare ruído e temperatura sob a mesma carga.");
    performance = "O resultado depende do processador, da temperatura ambiente, do gabinete e da rotação das ventoinhas. O encaixe sozinho não valida a refrigeração.";
  } else if (part.category === "case") {
    if (Array.isArray(s.formFactors)) strengths.push(`Suporta os formatos ${s.formFactors.join(", ")} informados na ficha.`);
    cautions.push("Radiadores, ventoinhas e cabos podem reduzir o espaço útil. Confira a combinação completa de peças.");
    performance = "A ventilação pode afetar temperaturas e ruído. Dimensões ou número de ventoinhas não substituem testes de fluxo de ar.";
  } else {
    if (facts(s.resolution)) strengths.push(`Resolução informada: ${s.resolution}.`);
    if (facts(s.refresh)) strengths.push(`Atualização informada de ${s.refresh} Hz. Confira também o cabo e a entrada utilizados.`);
    cautions.push("Taxa de atualização não garante esse FPS no jogo. Tempo de resposta anunciado não substitui medições de transições e overshoot.");
    performance = "Considere resolução, nitidez, tempo de resposta, atraso e cores. A taxa de atualização define a frequência máxima de exibição, não a capacidade de renderização da GPU.";
  }
  if (!strengths.length) strengths.push("O modelo está cadastrado e pode ser comparado. Complete as especificações antes de decidir.");
  if (!part.source) cautions.push("Esta ficha ainda não tem uma fonte técnica vinculada. Os dados do catálogo devem ser confirmados antes da compra.");
  return { strengths, cautions, audience, performance };
}

export function relatedParts(part: Part, parts: Part[]) {
  const same = parts.filter(p => p.id !== part.id && p.category === part.category);
  return same.sort((a, b) => {
    const score = (p: Part) => (part.category === "gpu" && partIdentity(p).family === partIdentity(part).family ? 10 : 0) + (p.specs.socket && p.specs.socket === part.specs.socket ? 4 : 0) + (p.source ? 1 : 0);
    return score(b) - score(a);
  }).slice(0, 6);
}
