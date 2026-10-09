/**
 * Structured, local assembly walkthrough for the experimental 3D laboratory.
 * No AI-generated electrical advice, auto-completion, or claims of actual installation.
 * Visual stages are illustrative; consult the manufacturer documentation for exact hardware.
 */
export type AssemblyPart = "case" | "motherboard" | "ram" | "cooler" | "psu" | "gpu";
export type AssemblyStepId =
  | "safety"
  | "motherboard"
  | "ram"
  | "cooler"
  | "psu"
  | "storage"
  | "gpu"
  | "cables"
  | "boot";

export type AssemblyGuideStep = {
  id: AssemblyStepId;
  title: string;
  focus: AssemblyPart;
  /** Components that should appear assembled by this point in the demonstration. */
  installed: AssemblyPart[];
  /** Component that moves schematically toward its installed position on entry. */
  arriving: AssemblyPart | null;
  instruction: string;
  caution: string;
  verification: string;
  visualizationNote?: string;
};

const step = (
  id: AssemblyStepId,
  title: string,
  focus: AssemblyPart,
  installed: AssemblyPart[],
  arriving: AssemblyPart | null,
  instruction: string,
  caution: string,
  verification: string,
  visualizationNote?: string,
): AssemblyGuideStep => ({id,title,focus,installed,arriving,instruction,caution,verification,visualizationNote});

const BASE: AssemblyGuideStep[] = [
  step(
    "safety", "Preparar bancada e gabinete", "case", ["case"], null,
    "Desligue o PC, desligue a fonte, retire o cabo da tomada e organize parafusos, manuais e ferramentas. Trabalhe sobre superfície limpa e estável.",
    "Nunca instale componentes energizados. Evite tocar contatos elétricos e use cuidados contra eletricidade estática.",
    "Gabinete acessível, energia desconectada e manuais dos componentes separados.",
  ),
  step(
    "motherboard", "Preparar a placa-mãe e o processador", "motherboard", ["case","motherboard"], "motherboard",
    "Fora do gabinete, identifique o socket e confira o procedimento de instalação do processador e, se aplicável, do SSD M.2. Depois, confira e instale os espaçadores corretos do gabinete e fixe a placa-mãe.",
    "Nunca pressione o processador contra o socket nem coloque espaçadores extras sob a placa. A animação mostra a placa já montada, não os detalhes de instalação da CPU.",
    "Socket e placa-mãe sem danos; espaçadores alinhados; placa fixada sem esforço.",
    "CPU e SSD M.2 não têm modelos independentes nesta versão.",
  ),
  step(
    "ram", "Instalar os módulos de memória", "ram", ["case","motherboard","ram"], "ram",
    "Confira a posição recomendada pelo manual da placa-mãe para dois módulos (frequentemente A2 e B2). Alinhe o entalhe DDR e pressione uniformemente até as travas fecharem.",
    "Não force a memória invertida e não presuma a ordem dos slots sem consultar o manual.",
    "Módulos totalmente encaixados e travas fechadas.",
  ),
  step(
    "cooler", "Instalar o cooler do processador", "cooler", ["case","motherboard","ram","cooler"], "cooler",
    "Confirme o suporte ao socket e o kit de montagem. Aplique pasta térmica conforme as instruções do cooler, fixe o dissipador e conecte sua ventoinha ao CPU_FAN.",
    "Não use uma quantidade arbitrária de pasta térmica nem aperte parafusos fora da sequência indicada pelo fabricante. Confira o espaço disponível para a RAM.",
    "Cooler fixo, ventoinha conectada e nenhuma interferência evidente com a memória.",
    "O deslocamento 3D é esquemático, não uma demonstração do aperto do suporte.",
  ),
  step(
    "psu", "Instalar a fonte", "psu", ["case","motherboard","ram","cooler","psu"], "psu",
    "Posicione a fonte no compartimento inferior, deixando sua ventoinha voltada para uma entrada de ar efetiva. Fixe os parafusos e passe os cabos pelos espaços do gabinete.",
    "Uma fonte modular exige apenas cabos compatíveis com o fabricante e modelo exato. Nunca misture cabos modulares de fontes diferentes.",
    "Fonte presa, ventilação desobstruída e cabos corretamente encaminhados.",
  ),
  step(
    "storage", "Conferir armazenamento", "motherboard", ["case","motherboard","ram","cooler","psu"], null,
    "Instale SSDs SATA ou HDDs nas respectivas baias e conecte dados e alimentação conforme o modelo. Para SSD M.2, consulte o procedimento e a fixação específicos da placa-mãe.",
    "M.2 SATA e NVMe não são intercambiáveis em todos os slots. Verifique compatibilidade e dissipadores.",
    "Unidades fixas, conexões corretas e sem cabos próximos às ventoinhas.",
    "Armazenamento não é desenhado nesta cena experimental.",
  ),
  step(
    "gpu", "Instalar a placa de vídeo", "gpu", ["case","motherboard","ram","cooler","psu","gpu"], "gpu",
    "Remova os espelhos traseiros necessários, abra a trava do PCIe x16 indicado pelo manual, alinhe a GPU ao slot e pressione com cuidado. Fixe o bracket e conecte os cabos de alimentação requeridos.",
    "Confirme comprimento, espessura, ventilação, alimentação PCIe e margem de potência antes de instalar. Não force o slot.",
    "GPU firmemente encaixada, bracket parafusado, alimentação compatível conectada.",
    "Modelo dual-fan genérico; não representa os conectores do produto exato.",
  ),
  step(
    "cables", "Revisar cabos e fluxo de ar", "psu", ["case","motherboard","ram","cooler","psu","gpu"], null,
    "Verifique ATX 24 pinos, EPS/CPU, alimentação da GPU quando necessária, conectores de armazenamento, painel frontal e ventoinhas. Organize os cabos longe das pás.",
    "Conectores CPU/EPS e PCIe podem parecer parecidos, mas não são intercambiáveis. Confira formato, marcações e manuais.",
    "Nenhum cabo solto ou tensionado; ventoinhas livres; conectores identificados.",
    "Cabos e pinos não são representados visualmente.",
  ),
  step(
    "boot", "Primeiro teste e conferência final", "case", ["case","motherboard","ram","cooler","psu","gpu"], null,
    "Feche o gabinete após a revisão, conecte o monitor à saída de vídeo apropriada, reconecte a energia e inicie o PC. Confira POST, temperaturas, rotação dos ventiladores e identificação das peças na BIOS/UEFI.",
    "Se houver ruído anormal, cheiro de queimado ou superaquecimento, desligue e verifique a montagem antes de repetir o teste.",
    "POST realizado, unidades reconhecidas e temperaturas dentro dos parâmetros do fabricante.",
    "O simulador não liga nem testa fisicamente um computador.",
  ),
];

export function assemblyGuideSteps(hasGpu: boolean): AssemblyGuideStep[] {
  return BASE
    .filter(item => hasGpu || item.id !== "gpu")
    .map(item => !hasGpu
      ? {...item,installed:item.installed.filter(part => part !== "gpu")}
      : {...item,installed:[...item.installed]});
}

export function visibleAssemblyPart(step: AssemblyGuideStep, part: AssemblyPart, hasGpu: boolean): boolean {
  return (part !== "gpu" || hasGpu) && step.installed.includes(part);
}

export function assemblyGuideProgress(steps: AssemblyGuideStep[], checked: ReadonlySet<AssemblyStepId>): number {
  if (!steps.length) return 0;
  return Math.round(100 * steps.filter(item => checked.has(item.id)).length / steps.length);
}
