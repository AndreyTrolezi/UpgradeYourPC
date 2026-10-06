import type { GlossaryTerm, PartCategory } from "@/app/lib/types";

const term = (value: GlossaryTerm) => value;

export const glossary: GlossaryTerm[] = [
  term({ id: "tdp", name: "TDP", category: "Energia e temperatura", short: "Potência térmica de referência usada para dimensionar a refrigeração.", practical: "Na prática, não é o consumo exato. Uma CPU de 65 W pode consumir mais em boost; use também PPT/MTP e testes reais.", affects: ["cooler necessário", "temperatura", "ruído", "consumo"] }),
  term({ id: "ppt", name: "PPT / MTP", category: "Energia e temperatura", short: "Limite máximo aproximado de potência do pacote do processador.", practical: "É mais útil que o TDP para saber o pior caso. Na AMD aparece como PPT; na Intel, o limite turbo costuma ser chamado MTP.", affects: ["fonte", "VRM", "temperatura", "desempenho sustentado"] }),
  term({ id: "tgp", name: "TGP / TBP", category: "Energia e temperatura", short: "Potência típica ou total da placa de vídeo.", practical: "Ajuda a estimar consumo, calor e tamanho da fonte. Picos transitórios ainda podem ultrapassar o valor médio.", affects: ["fonte", "cabos", "temperatura", "conta de energia"] }),
  term({ id: "cores", name: "Núcleos", category: "Processador", short: "Unidades físicas de processamento dentro da CPU.", practical: "Mais núcleos ajudam em renderização, compilação, streaming e multitarefa, mas jogos também dependem da arquitetura e da latência.", affects: ["produtividade", "multitarefa", "FPS mínimo"] }),
  term({ id: "threads", name: "Threads", category: "Processador", short: "Fluxos de trabalho que a CPU consegue manter em paralelo.", practical: "Threads extras aproveitam melhor cada núcleo em tarefas paralelas; não equivalem a núcleos físicos adicionais.", affects: ["multitarefa", "renderização", "compilação"] }),
  term({ id: "ipc", name: "IPC", category: "Processador", short: "Quantidade de trabalho feita pela CPU a cada ciclo de clock.", practical: "Duas CPUs a 4 GHz podem ter desempenhos bem diferentes. Arquiteturas novas normalmente fazem mais por ciclo.", affects: ["FPS", "responsividade", "desempenho por núcleo"] }),
  term({ id: "clock", name: "Clock e boost", category: "Processador", short: "Frequência em que os núcleos operam; boost é o pico automático.", practical: "Clock maior só é comparável dentro de arquiteturas semelhantes. Temperatura, energia e carga definem por quanto tempo o boost se mantém.", affects: ["desempenho por núcleo", "temperatura", "consumo"] }),
  term({ id: "l3", name: "Cache L3", category: "Processador", short: "Memória rápida compartilhada dentro do processador.", practical: "Reduz idas à RAM. Jogos sensíveis a latência podem ganhar bastante, como ocorre nos Ryzen X3D.", affects: ["FPS mínimo", "latência", "jogos"] }),
  term({ id: "v-cache", name: "3D V-Cache", category: "Processador", short: "Cache extra empilhado sobre o chip em determinados Ryzen X3D.", practical: "Pode elevar muito o FPS em jogos dependentes de CPU, mas não acelera todas as tarefas na mesma proporção.", affects: ["FPS em jogos", "1% lows", "custo"] }),
  term({ id: "socket", name: "Socket", category: "Compatibilidade", short: "Encaixe físico e elétrico entre CPU e placa-mãe.", practical: "AM4, AM5, LGA1700 e LGA1851 não são intercambiáveis. Socket igual ainda pode exigir BIOS compatível.", affects: ["compatibilidade", "placa-mãe", "caminho de upgrade"] }),
  term({ id: "chipset", name: "Chipset", category: "Placa-mãe", short: "Conjunto de recursos e conexões oferecido pela plataforma.", practical: "Define opções como overclock, quantidade de USB, pistas PCIe e armazenamento, mas não aumenta FPS sozinho.", affects: ["recursos", "expansão", "overclock"] }),
  term({ id: "vrm", name: "VRM", category: "Placa-mãe", short: "Circuito que converte e estabiliza energia para o processador.", practical: "VRM fraco ou quente pode limitar CPUs exigentes. Número de fases sozinho não prova qualidade: componentes e dissipação importam.", affects: ["estabilidade", "temperatura", "CPU suportada"] }),
  term({ id: "bios", name: "BIOS / UEFI", category: "Compatibilidade", short: "Firmware que inicia e configura o hardware da placa-mãe.", practical: "Uma atualização pode ser obrigatória para reconhecer uma CPU nova. O ideal é atualizar ainda com a CPU antiga instalada.", affects: ["compatibilidade da CPU", "RAM", "segurança"] }),
  term({ id: "pcie", name: "PCI Express", category: "Compatibilidade", short: "Barramento usado por GPU, SSD NVMe e outras placas.", practical: "A geração e o número de pistas definem a largura de banda. Uma GPU x8 pode perder um pouco mais em PCIe 3.0 que em 4.0.", affects: ["GPU", "SSD", "expansão"] }),
  term({ id: "form-factor", name: "Formato ATX / mATX / ITX", category: "Compatibilidade", short: "Tamanho físico padronizado de placas-mãe e gabinetes.", practical: "Uma placa ATX não cabe em gabinete limitado a mATX; placas menores normalmente cabem em gabinetes maiores.", affects: ["gabinete", "slots", "montagem"] }),
  term({ id: "vram", name: "VRAM", category: "Placa de vídeo", short: "Memória dedicada usada pela GPU para texturas, buffers e modelos.", practical: "Quando falta VRAM surgem travadas, texturas ruins ou queda de desempenho. Mais VRAM não torna uma GPU lenta automaticamente rápida.", affects: ["resolução", "texturas", "ray tracing", "IA"] }),
  term({ id: "memory-bus", name: "Barramento de memória", category: "Placa de vídeo", short: "Largura do caminho entre o chip gráfico e a VRAM.", practical: "Deve ser analisado com tipo, velocidade e cache. Um barramento estreito pode funcionar bem, mas tende a limitar certas cargas.", affects: ["largura de banda", "resolução", "desempenho"] }),
  term({ id: "raster", name: "Rasterização", category: "Placa de vídeo", short: "Forma tradicional de desenhar os pixels dos jogos.", practical: "É o desempenho sem considerar ray tracing e geração de quadros. Continua sendo a principal medida de força bruta em muitos jogos.", affects: ["FPS nativo", "qualidade gráfica", "resolução"] }),
  term({ id: "ray-tracing", name: "Ray tracing", category: "Placa de vídeo", short: "Simulação de raios de luz para reflexos, sombras e iluminação.", practical: "Melhora efeitos visuais, mas custa muito desempenho e VRAM; reconstrução de imagem costuma ser usada junto.", affects: ["qualidade visual", "FPS", "VRAM"] }),
  term({ id: "upscaling", name: "DLSS / FSR / XeSS", category: "Placa de vídeo", short: "Tecnologias que renderizam em resolução menor e reconstroem a imagem.", practical: "Podem aumentar bastante o FPS. Qualidade e suporte variam por jogo, modo e fabricante.", affects: ["FPS", "nitidez", "ray tracing"] }),
  term({ id: "frame-generation", name: "Geração de quadros", category: "Placa de vídeo", short: "Cria quadros intermediários para aumentar a fluidez exibida.", practical: "Não substitui FPS-base saudável e pode adicionar latência ou artefatos. É melhor quando o jogo já roda de forma estável.", affects: ["fluidez", "latência", "qualidade de imagem"] }),
  term({ id: "resizable-bar", name: "Resizable BAR / ReBAR", category: "Compatibilidade", short: "Permite que a CPU acesse uma região maior da memória da GPU.", practical: "Pode melhorar desempenho e é especialmente importante para algumas GPUs Intel. Exige suporte e configuração de BIOS.", affects: ["desempenho da GPU", "compatibilidade"] }),
  term({ id: "ddr", name: "DDR4 e DDR5", category: "Memória", short: "Gerações diferentes de memória RAM.", practical: "Os encaixes são diferentes. A placa-mãe determina qual geração usar; DDR5 oferece mais largura de banda, mas custa mais.", affects: ["compatibilidade", "plataforma", "desempenho"] }),
  term({ id: "mt-s", name: "MT/s", category: "Memória", short: "Milhões de transferências por segundo da memória.", practical: "DDR4-3200 faz 3200 MT/s. O número comercial não é o clock físico e deve ser avaliado junto da latência.", affects: ["largura de banda", "FPS mínimo", "iGPU"] }),
  term({ id: "cas", name: "CL / latência CAS", category: "Memória", short: "Quantidade de ciclos até a RAM começar a entregar determinados dados.", practical: "Menor CL ajuda, mas só pode ser comparado junto da frequência. CL16 em DDR4 e CL16 em outra velocidade não têm a mesma latência real.", affects: ["latência", "FPS mínimo", "responsividade"] }),
  term({ id: "dual-channel", name: "Dual channel", category: "Memória", short: "Uso de dois canais de memória em paralelo.", practical: "Dois módulos corretamente instalados aumentam a largura de banda e podem melhorar bastante jogos e gráficos integrados.", affects: ["largura de banda", "FPS", "iGPU"] }),
  term({ id: "xmp-expo", name: "XMP / EXPO", category: "Memória", short: "Perfis que aplicam automaticamente frequência, tensão e timings anunciados.", practical: "Sem ativá-los, um kit rápido pode operar abaixo da velocidade comprada. Ainda é tecnicamente um ajuste de memória e depende da plataforma.", affects: ["velocidade da RAM", "estabilidade", "desempenho"] }),
  term({ id: "nvme", name: "NVMe", category: "Armazenamento", short: "Protocolo de SSD otimizado para funcionar sobre PCI Express.", practical: "Reduz transferências e carregamentos pesados, mas trocar um bom SSD SATA por NVMe nem sempre aumenta FPS.", affects: ["carregamento", "cópia de arquivos", "produtividade"] }),
  term({ id: "nand", name: "TLC / QLC", category: "Armazenamento", short: "Formas de armazenar bits nas células de memória NAND.", practical: "TLC normalmente sustenta melhor gravação e durabilidade; QLC prioriza capacidade e preço, dependendo mais do cache.", affects: ["gravação sustentada", "durabilidade", "preço"] }),
  term({ id: "dram-ssd", name: "DRAM no SSD", category: "Armazenamento", short: "Memória rápida dedicada ao mapa de endereços do SSD.", practical: "Ajuda principalmente em carga pesada e gravação sustentada. SSDs sem DRAM podem compensar parcialmente com HMB.", affects: ["consistência", "carga pesada", "preço"] }),
  term({ id: "80-plus", name: "80 Plus", category: "Fonte", short: "Certificação de eficiência elétrica em pontos de carga.", practical: "Bronze ou Gold não mede sozinho segurança ou qualidade. Proteções, projeto interno e testes independentes são essenciais.", affects: ["eficiência", "calor", "conta de energia"] }),
  term({ id: "atx3", name: "ATX 3.0 / 3.1", category: "Fonte", short: "Padrão moderno para fontes, conectores e picos transitórios.", practical: "Facilita o uso de GPUs modernas e exige tolerância maior a picos rápidos de consumo.", affects: ["compatibilidade de GPU", "cabos", "picos de energia"] }),
  term({ id: "headroom", name: "Folga da fonte", category: "Fonte", short: "Margem entre o consumo estimado e a capacidade da fonte.", practical: "Uma margem razoável ajuda com picos, eficiência e upgrades; potência exagerada não corrige uma fonte de baixa qualidade.", affects: ["estabilidade", "ruído", "upgrade"] }),
  term({ id: "airflow", name: "Airflow", category: "Refrigeração", short: "Fluxo de ar que entra, atravessa e sai do gabinete.", practical: "Frente aberta, fans bem posicionadas e caminho livre ajudam CPU, GPU, SSD e VRM ao mesmo tempo.", affects: ["temperatura", "ruído", "boost"] }),
  term({ id: "refresh", name: "Taxa de atualização (Hz)", category: "Monitor", short: "Quantidade máxima de vezes que a tela atualiza por segundo.", practical: "Um monitor de 165 Hz mostra até 165 quadros novos por segundo; a GPU e CPU precisam gerar FPS suficiente para aproveitá-lo.", affects: ["fluidez", "latência percebida", "meta de FPS"] }),
  term({ id: "vrr", name: "VRR / Adaptive Sync", category: "Monitor", short: "Sincroniza a atualização da tela com os quadros entregues pela GPU.", practical: "Reduz tearing e engasgos quando o FPS varia dentro da faixa suportada.", affects: ["fluidez", "tearing", "experiência"] }),
  term({ id: "resolution", name: "Resolução", category: "Monitor", short: "Quantidade de pixels exibidos na tela.", practical: "1440p exige cerca de 78% mais pixels que 1080p; 4K exige quatro vezes os pixels de 1080p, aumentando a carga na GPU.", affects: ["nitidez", "VRAM", "desempenho da GPU"] }),
  term({ id: "bottleneck", name: "Gargalo", category: "Desempenho", short: "Componente que limita o resultado naquele jogo ou tarefa.", practical: "Não é uma porcentagem fixa. O gargalo muda com resolução, jogo, qualidade gráfica, cena e meta de FPS.", affects: ["FPS", "aproveitamento", "prioridade de upgrade"] }),
];

export type CompareMetric = {
  key: string;
  label: string;
  termId?: string;
  higher?: boolean;
  unit?: string;
};

export const compareMetrics: Record<PartCategory, CompareMetric[]> = {
  cpu: [
    { key: "socket", label: "Socket", termId: "socket" },
    { key: "cores", label: "Núcleos", termId: "cores", higher: true },
    { key: "threads", label: "Threads", termId: "threads", higher: true },
    { key: "boostClock", label: "Boost", termId: "clock", higher: true, unit: "GHz" },
    { key: "l3", label: "Cache L3", termId: "l3", higher: true, unit: "MB" },
    { key: "tdp", label: "TDP", termId: "tdp", unit: "W" },
    { key: "maxPower", label: "PPT / MTP", termId: "ppt", unit: "W" },
    { key: "gamingIndex", label: "Índice em jogos", higher: true },
    { key: "workIndex", label: "Índice em produtividade", higher: true },
  ],
  motherboard: [
    { key: "socket", label: "Socket", termId: "socket" }, { key: "chipset", label: "Chipset", termId: "chipset" },
    { key: "formFactor", label: "Formato", termId: "form-factor" }, { key: "memoryType", label: "Memória", termId: "ddr" },
    { key: "memorySlots", label: "Slots de RAM", higher: true }, { key: "m2Slots", label: "Slots M.2", higher: true },
    { key: "vrmTier", label: "Nível do VRM", termId: "vrm", higher: true }, { key: "biosFlashback", label: "BIOS Flashback" },
  ],
  gpu: [
    { key: "gpuVendor", label: "Arquitetura / fabricante" }, { key: "vram", label: "VRAM", termId: "vram", higher: true, unit: "GB" },
    { key: "memoryBus", label: "Barramento", termId: "memory-bus", higher: true, unit: "bit" }, { key: "tgp", label: "TGP", termId: "tgp", unit: "W" },
    { key: "rasterIndex", label: "Rasterização", termId: "raster", higher: true }, { key: "rtIndex", label: "Ray tracing", termId: "ray-tracing", higher: true },
    { key: "psuRecommended", label: "Fonte recomendada", termId: "headroom", unit: "W" }, { key: "encoder", label: "Encoder" },
  ],
  memory: [
    { key: "memoryType", label: "Geração", termId: "ddr" }, { key: "capacity", label: "Capacidade", higher: true, unit: "GB" },
    { key: "modules", label: "Módulos", termId: "dual-channel", higher: true }, { key: "speed", label: "Velocidade", termId: "mt-s", higher: true, unit: "MT/s" },
    { key: "cas", label: "Latência CAS", termId: "cas" }, { key: "voltage", label: "Tensão", unit: "V" },
  ],
  storage: [
    { key: "interface", label: "Interface", termId: "nvme" }, { key: "capacity", label: "Capacidade", higher: true, unit: "GB" },
    { key: "read", label: "Leitura sequencial", higher: true, unit: "MB/s" }, { key: "write", label: "Gravação sequencial", higher: true, unit: "MB/s" },
    { key: "nand", label: "Memória / mídia", termId: "nand" }, { key: "dram", label: "DRAM", termId: "dram-ssd" },
  ],
  psu: [
    { key: "wattage", label: "Potência", termId: "headroom", higher: true, unit: "W" }, { key: "efficiency", label: "Eficiência", termId: "80-plus" },
    { key: "modular", label: "Cabos modulares" }, { key: "atxVersion", label: "Padrão ATX", termId: "atx3" },
    { key: "pcie5", label: "Cabo PCIe 5" }, { key: "qualityTier", label: "Nível de projeto", higher: true }, { key: "warrantyYears", label: "Garantia", higher: true, unit: "anos" },
  ],
  cooler: [
    { key: "coolerType", label: "Tipo" }, { key: "tdpCapacity", label: "Capacidade estimada", termId: "tdp", higher: true, unit: "W" },
    { key: "height", label: "Altura", unit: "mm" }, { key: "radiator", label: "Radiador", unit: "mm" },
    { key: "fans", label: "Ventoinhas", higher: true }, { key: "noise", label: "Ruído informado", unit: "dBA" },
  ],
  case: [
    { key: "formFactors", label: "Placas-mãe", termId: "form-factor" }, { key: "gpuLength", label: "GPU máxima", higher: true, unit: "mm" },
    { key: "coolerHeight", label: "Cooler máximo", higher: true, unit: "mm" }, { key: "radiatorTop", label: "Radiador superior", higher: true, unit: "mm" },
    { key: "radiatorFront", label: "Radiador frontal", higher: true, unit: "mm" }, { key: "airflow", label: "Nível de airflow", termId: "airflow", higher: true },
  ],
  monitor: [
    { key: "resolution", label: "Resolução", termId: "resolution" }, { key: "refresh", label: "Taxa de atualização", termId: "refresh", higher: true, unit: "Hz" },
    { key: "panel", label: "Painel" }, { key: "size", label: "Tamanho", unit: "pol" }, { key: "vrr", label: "VRR", termId: "vrr" }, { key: "hdr", label: "HDR" },
  ],
};

export const glossaryById = (id?: string) => glossary.find((item) => item.id === id);
