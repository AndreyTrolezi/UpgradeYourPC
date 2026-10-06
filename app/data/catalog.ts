import type { BuildConfig, Part, PartCategory } from "@/app/lib/types";
import { expandedCatalog } from "@/app/data/catalog-expanded";
import { verifiedCatalog } from "@/app/data/catalog-verified";

const part = (value: Part) => value;

export const categoryMeta: Record<
  PartCategory,
  { label: string; short: string; description: string; multi?: boolean }
> = {
  cpu: { label: "Processador", short: "CPU", description: "Desempenho geral, FPS máximo e produtividade." },
  motherboard: { label: "Placa-mãe", short: "Placa-mãe", description: "Define plataforma, recursos e caminho de upgrade." },
  gpu: { label: "Placa de vídeo", short: "GPU", description: "Principal peça para resolução, qualidade gráfica e ray tracing." },
  memory: { label: "Memória RAM", short: "RAM", description: "Capacidade e velocidade para jogos e multitarefa." },
  storage: { label: "Armazenamento", short: "SSD / HD", description: "Espaço e velocidade de carregamento.", multi: true },
  psu: { label: "Fonte", short: "Fonte", description: "Entrega energia com segurança e folga para upgrades." },
  cooler: { label: "Refrigeração", short: "Cooler", description: "Controla temperatura, ruído e desempenho sustentado." },
  case: { label: "Gabinete", short: "Gabinete", description: "Limites físicos, ventilação e organização do conjunto." },
  monitor: { label: "Monitor", short: "Monitor", description: "Determina resolução e FPS que realmente precisam ser entregues.", multi: true },
};

export const catalog: Part[] = [
  part({
    id: "r5-3600", category: "cpu", brand: "AMD", name: "Ryzen 5 3600", price: 0, year: 2019, platform: "AM4",
    summary: "6 núcleos Zen 2; referência do setup do Andrey.", tags: ["AM4", "DDR4", "atual"], quality: "boa",
    qualityNote: "Ainda equilibrado, mas pode limitar GPUs fortes em FPS alto.",
    specs: { socket: "AM4", cores: 6, threads: 12, architecture: "Zen 2", baseClock: 3.6, boostClock: 4.2, l3: 32, tdp: 65, maxPower: 88, memoryType: ["DDR4"], gamingIndex: 100, workIndex: 100, igpu: false, coolerIncluded: true },
  }),
  part({
    id: "r5-5600", category: "cpu", brand: "AMD", name: "Ryzen 5 5600", price: 650, year: 2022, platform: "AM4",
    summary: "Entrada Zen 3 econômica para quem já está no AM4.", tags: ["AM4", "DDR4", "custo-benefício"], quality: "boa",
    qualityNote: "Bom consumo e desempenho; salto menor para quem já usa um Ryzen 5 3600.",
    specs: { socket: "AM4", cores: 6, threads: 12, architecture: "Zen 3", baseClock: 3.5, boostClock: 4.4, l3: 32, tdp: 65, maxPower: 88, memoryType: ["DDR4"], gamingIndex: 117, workIndex: 121, igpu: false, coolerIncluded: true },
  }),
  part({
    id: "r7-5700x", category: "cpu", brand: "AMD", name: "Ryzen 7 5700X", price: 950, year: 2022, platform: "AM4",
    summary: "Upgrade AM4 frio e equilibrado para jogos e trabalho.", tags: ["AM4", "DDR4", "8 núcleos"], quality: "excelente",
    qualityNote: "Ótimo equilíbrio térmico; pede cooler torre para manter baixo ruído.",
    specs: { socket: "AM4", cores: 8, threads: 16, architecture: "Zen 3", baseClock: 3.4, boostClock: 4.6, l3: 32, tdp: 65, maxPower: 88, memoryType: ["DDR4"], gamingIndex: 124, workIndex: 140, igpu: false, coolerIncluded: false },
  }),
  part({
    id: "r7-5700x3d", category: "cpu", brand: "AMD", name: "Ryzen 7 5700X3D", price: 1400, year: 2024, platform: "AM4",
    summary: "Grande salto em jogos sem trocar placa-mãe e memória.", tags: ["AM4", "3D V-Cache", "jogos"], quality: "excelente",
    qualityNote: "Ponto forte do AM4 para jogos; requer refrigeração torre competente.",
    specs: { socket: "AM4", cores: 8, threads: 16, architecture: "Zen 3", baseClock: 3.0, boostClock: 4.1, l3: 96, tdp: 105, maxPower: 142, memoryType: ["DDR4"], gamingIndex: 153, workIndex: 135, igpu: false, coolerIncluded: false },
  }),
  part({
    id: "r9-5900x", category: "cpu", brand: "AMD", name: "Ryzen 9 5900X", price: 1600, year: 2020, platform: "AM4",
    summary: "12 núcleos para renderização, compilação e criação.", tags: ["AM4", "produtividade", "12 núcleos"], quality: "excelente",
    qualityNote: "Excelente multithread; em jogos costuma perder sentido frente ao 5700X3D.",
    specs: { socket: "AM4", cores: 12, threads: 24, architecture: "Zen 3", baseClock: 3.7, boostClock: 4.8, l3: 64, tdp: 105, maxPower: 142, memoryType: ["DDR4"], gamingIndex: 130, workIndex: 192, igpu: false, coolerIncluded: false },
  }),
  part({
    id: "r5-7600", category: "cpu", brand: "AMD", name: "Ryzen 5 7600", price: 1250, year: 2023, platform: "AM5",
    summary: "Entrada AM5 eficiente, com vídeo integrado e caminho de upgrade.", tags: ["AM5", "DDR5", "upgrade futuro"], quality: "excelente",
    qualityNote: "Plataforma moderna e eficiente; exige placa-mãe AM5 e DDR5.",
    specs: { socket: "AM5", cores: 6, threads: 12, architecture: "Zen 4", baseClock: 3.8, boostClock: 5.1, l3: 32, tdp: 65, maxPower: 88, memoryType: ["DDR5"], gamingIndex: 157, workIndex: 154, igpu: true, coolerIncluded: true },
  }),
  part({
    id: "r7-7800x3d", category: "cpu", brand: "AMD", name: "Ryzen 7 7800X3D", price: 2900, year: 2023, platform: "AM5",
    summary: "CPU AM5 especializada em jogos com grande cache.", tags: ["AM5", "DDR5", "3D V-Cache"], quality: "excelente",
    qualityNote: "Muito forte em jogos e eficiente; investimento de plataforma é maior.",
    specs: { socket: "AM5", cores: 8, threads: 16, architecture: "Zen 4", baseClock: 4.2, boostClock: 5.0, l3: 96, tdp: 120, maxPower: 162, memoryType: ["DDR5"], gamingIndex: 193, workIndex: 170, igpu: true, coolerIncluded: false },
  }),
  part({
    id: "i5-12400f", category: "cpu", brand: "Intel", name: "Core i5-12400F", price: 780, year: 2022, platform: "LGA1700",
    summary: "6 núcleos P-Core eficientes e bom custo para jogos.", tags: ["Intel", "LGA1700", "custo-benefício"], quality: "boa",
    qualityNote: "Consumo controlado; versão F exige placa de vídeo dedicada.",
    specs: { socket: "LGA1700", cores: 6, threads: 12, architecture: "Alder Lake", baseClock: 2.5, boostClock: 4.4, l3: 18, tdp: 65, maxPower: 117, memoryType: ["DDR4", "DDR5"], gamingIndex: 126, workIndex: 132, igpu: false, coolerIncluded: true },
  }),
  part({
    id: "i5-13400f", category: "cpu", brand: "Intel", name: "Core i5-13400F", price: 1150, year: 2023, platform: "LGA1700",
    summary: "Arquitetura híbrida com 10 núcleos para uso misto.", tags: ["Intel", "LGA1700", "híbrido"], quality: "boa",
    qualityNote: "Bom equilíbrio; confira se a placa-mãe usa DDR4 ou DDR5.",
    specs: { socket: "LGA1700", cores: 10, threads: 16, architecture: "Raptor Lake", baseClock: 2.5, boostClock: 4.6, l3: 20, tdp: 65, maxPower: 148, memoryType: ["DDR4", "DDR5"], gamingIndex: 142, workIndex: 158, igpu: false, coolerIncluded: true },
  }),
  part({
    id: "i5-14600k", category: "cpu", brand: "Intel", name: "Core i5-14600K", price: 1750, year: 2023, platform: "LGA1700",
    summary: "14 núcleos híbridos e alta frequência para jogos e criação.", tags: ["Intel", "LGA1700", "desbloqueado"], quality: "excelente",
    qualityNote: "Muito rápido, mas exige placa-mãe e refrigeração dimensionadas para o consumo máximo.",
    specs: { socket: "LGA1700", cores: 14, threads: 20, architecture: "Raptor Lake Refresh", baseClock: 3.5, boostClock: 5.3, l3: 24, tdp: 125, maxPower: 181, memoryType: ["DDR4", "DDR5"], gamingIndex: 177, workIndex: 211, igpu: true, coolerIncluded: false },
  }),
  part({
    id: "i7-14700k", category: "cpu", brand: "Intel", name: "Core i7-14700K", price: 2600, year: 2023, platform: "LGA1700",
    summary: "20 núcleos híbridos para produtividade pesada e alto FPS.", tags: ["Intel", "LGA1700", "produtividade"], quality: "excelente",
    qualityNote: "Desempenho alto com demanda térmica e elétrica elevada.",
    specs: { socket: "LGA1700", cores: 20, threads: 28, architecture: "Raptor Lake Refresh", baseClock: 3.4, boostClock: 5.6, l3: 33, tdp: 125, maxPower: 253, memoryType: ["DDR4", "DDR5"], gamingIndex: 187, workIndex: 282, igpu: true, coolerIncluded: false },
  }),
  part({
    id: "ultra5-245k", category: "cpu", brand: "Intel", name: "Core Ultra 5 245K", price: 2100, year: 2024, platform: "LGA1851",
    summary: "Plataforma Intel mais nova com DDR5 e NPU integrada.", tags: ["Intel", "LGA1851", "DDR5"], quality: "boa",
    qualityNote: "Boa produtividade e plataforma moderna; custo total exige placa LGA1851 e DDR5.",
    specs: { socket: "LGA1851", cores: 14, threads: 14, architecture: "Arrow Lake", baseClock: 4.2, boostClock: 5.2, l3: 24, tdp: 125, maxPower: 159, memoryType: ["DDR5"], gamingIndex: 169, workIndex: 225, igpu: true, coolerIncluded: false },
  }),

  part({
    id: "asus-prime-b550ma", category: "motherboard", brand: "ASUS", name: "Prime B550M-A", price: 0, year: 2020, platform: "AM4",
    summary: "Placa-mãe atual do Andrey, mATX com chipset B550.", tags: ["AM4", "DDR4", "mATX", "atual"], quality: "boa",
    qualityNote: "Adequada para Ryzen 5 e Ryzen 7 de 65–105 W com airflow; confirme a BIOS para CPUs mais novas.",
    specs: { socket: "AM4", chipset: "B550", formFactor: "mATX", memoryType: "DDR4", memorySlots: 4, maxMemory: 128, pcieGpu: "PCIe 4.0 x16", m2Slots: 2, vrmTier: 3, biosFlashback: false, wifi: false },
  }),
  part({
    id: "msi-b550m-pro-vdh", category: "motherboard", brand: "MSI", name: "B550M PRO-VDH WiFi", price: 750, platform: "AM4",
    summary: "B550 mATX equilibrada, com Wi-Fi e BIOS Flashback.", tags: ["AM4", "DDR4", "Wi-Fi"], quality: "boa",
    qualityNote: "Conjunto sólido para CPUs AM4 intermediárias e boa recuperação de BIOS.",
    specs: { socket: "AM4", chipset: "B550", formFactor: "mATX", memoryType: "DDR4", memorySlots: 4, maxMemory: 128, pcieGpu: "PCIe 4.0 x16", m2Slots: 2, vrmTier: 4, biosFlashback: true, wifi: true },
  }),
  part({
    id: "msi-b550-tomahawk", category: "motherboard", brand: "MSI", name: "MAG B550 Tomahawk", price: 1050, platform: "AM4",
    summary: "B550 ATX robusta para Ryzen 9 e expansão.", tags: ["AM4", "DDR4", "ATX"], quality: "excelente",
    qualityNote: "VRM forte e boa conectividade; só vale trocar se os recursos adicionais forem necessários.",
    specs: { socket: "AM4", chipset: "B550", formFactor: "ATX", memoryType: "DDR4", memorySlots: 4, maxMemory: 128, pcieGpu: "PCIe 4.0 x16", m2Slots: 2, vrmTier: 5, biosFlashback: true, wifi: false },
  }),
  part({
    id: "asrock-b650m-hdv", category: "motherboard", brand: "ASRock", name: "B650M-HDV/M.2", price: 950, platform: "AM5",
    summary: "Entrada AM5 enxuta com boa base elétrica.", tags: ["AM5", "DDR5", "mATX"], quality: "boa",
    qualityNote: "Boa base para AM5; oferece menos slots que modelos maiores.",
    specs: { socket: "AM5", chipset: "B650", formFactor: "mATX", memoryType: "DDR5", memorySlots: 2, maxMemory: 96, pcieGpu: "PCIe 4.0 x16", m2Slots: 2, vrmTier: 4, biosFlashback: true, wifi: false },
  }),
  part({
    id: "msi-b650-tomahawk", category: "motherboard", brand: "MSI", name: "MAG B650 Tomahawk WiFi", price: 1550, platform: "AM5",
    summary: "AM5 ATX completa para upgrades de longo prazo.", tags: ["AM5", "DDR5", "Wi-Fi"], quality: "excelente",
    qualityNote: "VRM e conectividade fortes; custo maior que placas AM5 de entrada.",
    specs: { socket: "AM5", chipset: "B650", formFactor: "ATX", memoryType: "DDR5", memorySlots: 4, maxMemory: 192, pcieGpu: "PCIe 4.0 x16", m2Slots: 3, vrmTier: 5, biosFlashback: true, wifi: true },
  }),
  part({
    id: "asus-b760m-a-d4", category: "motherboard", brand: "ASUS", name: "Prime B760M-A D4", price: 900, platform: "LGA1700",
    summary: "Plataforma Intel LGA1700 mantendo memória DDR4.", tags: ["Intel", "DDR4", "mATX"], quality: "boa",
    qualityNote: "Boa para i5; CPUs K de alto consumo pedem análise térmica mais cuidadosa.",
    specs: { socket: "LGA1700", chipset: "B760", formFactor: "mATX", memoryType: "DDR4", memorySlots: 4, maxMemory: 128, pcieGpu: "PCIe 4.0 x16", m2Slots: 2, vrmTier: 3, biosFlashback: false, wifi: false },
  }),
  part({
    id: "msi-b760-tomahawk", category: "motherboard", brand: "MSI", name: "MAG B760 Tomahawk WiFi DDR5", price: 1450, platform: "LGA1700",
    summary: "Intel DDR5 robusta, com boa conectividade.", tags: ["Intel", "DDR5", "Wi-Fi"], quality: "excelente",
    qualityNote: "Boa para i5/i7 sem foco em overclock; plataforma LGA1700 está no fim do ciclo.",
    specs: { socket: "LGA1700", chipset: "B760", formFactor: "ATX", memoryType: "DDR5", memorySlots: 4, maxMemory: 192, pcieGpu: "PCIe 5.0 x16", m2Slots: 3, vrmTier: 5, biosFlashback: true, wifi: true },
  }),
  part({
    id: "asrock-b860m-pro", category: "motherboard", brand: "ASRock", name: "B860M Pro RS WiFi", price: 1350, platform: "LGA1851",
    summary: "Base Intel LGA1851 com DDR5 e Wi-Fi.", tags: ["Intel", "LGA1851", "DDR5"], quality: "boa",
    qualityNote: "Plataforma recente e equilibrada; confirme recursos e BIOS do modelo exato.",
    specs: { socket: "LGA1851", chipset: "B860", formFactor: "mATX", memoryType: "DDR5", memorySlots: 4, maxMemory: 256, pcieGpu: "PCIe 5.0 x16", m2Slots: 3, vrmTier: 4, biosFlashback: true, wifi: true },
  }),

  part({
    id: "rtx3050-gainward", category: "gpu", brand: "Gainward", name: "GeForce RTX 3050 8 GB", price: 0, year: 2022,
    summary: "GPU atual do Andrey; base 100 dos índices gráficos.", tags: ["NVIDIA", "8 GB", "atual"], quality: "boa",
    qualityNote: "Construção simples e consumo baixo; adequada para 1080p com ajustes.",
    specs: { gpuVendor: "NVIDIA", vram: 8, memoryBus: 128, tgp: 130, psuRecommended: 450, length: 245, rasterIndex: 100, rtIndex: 100, encoder: "NVENC", pcie: "4.0 x8" },
  }),
  part({
    id: "arc-b580", category: "gpu", brand: "Intel", name: "Arc B580 12 GB", price: 1830, year: 2024,
    summary: "12 GB e bom valor para 1080p/1440p quando o software coopera.", tags: ["Intel", "12 GB", "AV1"], quality: "boa",
    qualityNote: "Hardware competitivo; confirme compatibilidade de jogos antigos e mantenha ReBAR ativo.",
    specs: { gpuVendor: "Intel", vram: 12, memoryBus: 192, tgp: 190, psuRecommended: 600, length: 272, rasterIndex: 225, rtIndex: 205, encoder: "Xe Media / AV1", pcie: "4.0 x8" },
  }),
  part({
    id: "rx7600", category: "gpu", brand: "AMD", name: "Radeon RX 7600 8 GB", price: 1750, year: 2023,
    summary: "Rasterização forte para 1080p com consumo moderado.", tags: ["AMD", "8 GB", "1080p"], quality: "boa",
    qualityNote: "Bom desempenho tradicional; 8 GB e ray tracing são os limites principais.",
    specs: { gpuVendor: "AMD", vram: 8, memoryBus: 128, tgp: 165, psuRecommended: 550, length: 270, rasterIndex: 172, rtIndex: 112, encoder: "VCN / AV1", pcie: "4.0 x8" },
  }),
  part({
    id: "rtx4060", category: "gpu", brand: "NVIDIA", name: "GeForce RTX 4060 8 GB", price: 1900, year: 2023,
    summary: "GPU eficiente para 1080p, com DLSS e encoder AV1.", tags: ["NVIDIA", "8 GB", "eficiente"], quality: "boa",
    qualityNote: "Consumo excelente; largura de banda e 8 GB pedem atenção em 1440p pesado.",
    specs: { gpuVendor: "NVIDIA", vram: 8, memoryBus: 128, tgp: 115, psuRecommended: 550, length: 250, rasterIndex: 170, rtIndex: 188, encoder: "NVENC / AV1", pcie: "4.0 x8" },
  }),
  part({
    id: "rx7700xt", category: "gpu", brand: "AMD", name: "Radeon RX 7700 XT 12 GB", price: 3300, year: 2023,
    summary: "Boa força bruta e 12 GB para 1440p.", tags: ["AMD", "12 GB", "1440p"], quality: "excelente",
    qualityNote: "Ótima em rasterização; compare modelos pelo cooler, ruído e garantia.",
    specs: { gpuVendor: "AMD", vram: 12, memoryBus: 192, tgp: 245, psuRecommended: 700, length: 320, rasterIndex: 248, rtIndex: 168, encoder: "VCN / AV1", pcie: "4.0 x16" },
  }),
  part({
    id: "rx9060xt-16", category: "gpu", brand: "AMD", name: "Radeon RX 9060 XT 16 GB", price: 2550, year: 2025,
    summary: "16 GB, consumo contido e foco em 1080p/1440p.", tags: ["AMD", "16 GB", "1440p"], quality: "excelente",
    qualityNote: "A versão de 16 GB é a escolha mais folgada; examine cada fabricante separadamente.",
    specs: { gpuVendor: "AMD", vram: 16, memoryBus: 128, tgp: 160, psuRecommended: 550, length: 300, rasterIndex: 265, rtIndex: 225, encoder: "VCN / AV1", pcie: "5.0 x16" },
  }),
  part({
    id: "rtx5070", category: "gpu", brand: "NVIDIA", name: "GeForce RTX 5070 12 GB", price: 5500, year: 2025,
    summary: "GPU forte para 1440p em alta taxa e recursos RTX.", tags: ["NVIDIA", "12 GB", "1440p"], quality: "excelente",
    qualityNote: "Desempenho elevado; 12 GB e qualidade específica do modelo devem entrar na decisão.",
    specs: { gpuVendor: "NVIDIA", vram: 12, memoryBus: 192, tgp: 250, psuRecommended: 650, length: 305, rasterIndex: 350, rtIndex: 430, encoder: "NVENC / AV1", pcie: "5.0 x16" },
  }),
  part({
    id: "rx9070xt", category: "gpu", brand: "AMD", name: "Radeon RX 9070 XT 16 GB", price: 5200, year: 2025,
    summary: "16 GB e alto desempenho para 1440p/4K.", tags: ["AMD", "16 GB", "4K"], quality: "excelente",
    qualityNote: "Muito forte; consumo, tamanho e construção variam bastante entre modelos.",
    specs: { gpuVendor: "AMD", vram: 16, memoryBus: 256, tgp: 304, psuRecommended: 750, length: 330, rasterIndex: 395, rtIndex: 390, encoder: "VCN / AV1", pcie: "5.0 x16" },
  }),
  part({
    id: "rtx5070ti", category: "gpu", brand: "NVIDIA", name: "GeForce RTX 5070 Ti 16 GB", price: 7200, year: 2025,
    summary: "16 GB e margem maior para 4K e criação.", tags: ["NVIDIA", "16 GB", "4K"], quality: "excelente",
    qualityNote: "Faixa premium; exige fonte, gabinete e orçamento coerentes.",
    specs: { gpuVendor: "NVIDIA", vram: 16, memoryBus: 256, tgp: 300, psuRecommended: 750, length: 330, rasterIndex: 455, rtIndex: 560, encoder: "NVENC / AV1", pcie: "5.0 x16" },
  }),

  part({
    id: "xpg-16-ddr4-3200", category: "memory", brand: "ADATA XPG", name: "Gammix D30 16 GB (2×8) DDR4-3200 CL16", price: 0,
    summary: "Kit atual em dual channel do Andrey.", tags: ["DDR4", "16 GB", "dual channel", "atual"], quality: "boa",
    qualityNote: "Configuração equilibrada; 32 GB traz mais folga para AAA e multitarefa.",
    specs: { memoryType: "DDR4", capacity: 16, modules: 2, speed: 3200, cas: 16, voltage: 1.35, ecc: false },
  }),
  part({
    id: "ddr4-32-3200", category: "memory", brand: "Kingston", name: "Fury Beast 32 GB (2×16) DDR4-3200 CL16", price: 480,
    summary: "Capacidade confortável para jogos modernos e multitarefa.", tags: ["DDR4", "32 GB", "dual channel"], quality: "excelente",
    qualityNote: "Perfil seguro e compatível com grande parte das plataformas DDR4.",
    specs: { memoryType: "DDR4", capacity: 32, modules: 2, speed: 3200, cas: 16, voltage: 1.35, ecc: false },
  }),
  part({
    id: "ddr4-32-3600", category: "memory", brand: "Corsair", name: "Vengeance LPX 32 GB (2×16) DDR4-3600 CL18", price: 560,
    summary: "Kit DDR4 rápido com perfil baixo.", tags: ["DDR4", "32 GB", "3600 MT/s"], quality: "boa",
    qualityNote: "Bom ponto para Ryzen 5000; XMP/DOCP pode exigir ajuste conforme placa e CPU.",
    specs: { memoryType: "DDR4", capacity: 32, modules: 2, speed: 3600, cas: 18, voltage: 1.35, ecc: false },
  }),
  part({
    id: "ddr5-32-6000", category: "memory", brand: "Kingston", name: "Fury Beast 32 GB (2×16) DDR5-6000 CL36", price: 780,
    summary: "Kit DDR5 equilibrado para AM5 e Intel modernos.", tags: ["DDR5", "32 GB", "6000 MT/s"], quality: "excelente",
    qualityNote: "Boa combinação de capacidade e velocidade; confirme perfil EXPO/XMP.",
    specs: { memoryType: "DDR5", capacity: 32, modules: 2, speed: 6000, cas: 36, voltage: 1.35, ecc: "on-die" },
  }),
  part({
    id: "ddr5-64-6000", category: "memory", brand: "G.Skill", name: "Flare X5 64 GB (2×32) DDR5-6000 CL32", price: 1450,
    summary: "Alta capacidade para criação, máquinas virtuais e projetos pesados.", tags: ["DDR5", "64 GB", "produtividade"], quality: "excelente",
    qualityNote: "Excelente para trabalho; desnecessária para a maioria dos PCs focados apenas em jogos.",
    specs: { memoryType: "DDR5", capacity: 64, modules: 2, speed: 6000, cas: 32, voltage: 1.4, ecc: "on-die" },
  }),

  part({
    id: "kingston-nv3-500", category: "storage", brand: "Kingston", name: "NV3 500 GB NVMe", price: 0,
    summary: "SSD NVMe atual para sistema e jogos principais.", tags: ["NVMe", "500 GB", "atual"], quality: "boa",
    qualityNote: "SSD de entrada rápido no uso diário; desempenho sustentado varia com cache e capacidade.",
    specs: { interface: "PCIe 4.0 x4", formFactor: "M.2 2280", capacity: 500, read: 5000, write: 3000, nand: "3D NAND", dram: false },
  }),
  part({
    id: "lexar-sata-256", category: "storage", brand: "Lexar", name: "SSD SATA 256 GB", price: 0,
    summary: "SSD SATA atual usado como armazenamento adicional.", tags: ["SATA", "256 GB", "atual"], quality: "básica",
    qualityNote: "Muito melhor que HD para programas, mas limitado pela interface SATA e pela capacidade.",
    specs: { interface: "SATA 6 Gb/s", formFactor: "2,5 polegadas", capacity: 256, read: 550, write: 450, nand: "3D NAND", dram: false },
  }),
  part({
    id: "toshiba-hdd-500", category: "storage", brand: "Toshiba", name: "HD 500 GB", price: 0,
    summary: "Disco rígido atual para arquivos e jogos menos usados.", tags: ["SATA", "HDD", "atual"], quality: "básica",
    qualityNote: "Adequado para arquivos; carregamentos e responsividade ficam muito abaixo de um SSD.",
    specs: { interface: "SATA 6 Gb/s", formFactor: "3,5 polegadas", capacity: 500, read: 150, write: 140, nand: "Disco magnético", dram: true },
  }),
  part({
    id: "wd-sn770-1tb", category: "storage", brand: "Western Digital", name: "WD Black SN770 1 TB", price: 520,
    summary: "NVMe rápido e equilibrado para jogos.", tags: ["NVMe", "1 TB", "PCIe 4.0"], quality: "excelente",
    qualityNote: "Bom desempenho real e eficiência; não possui DRAM dedicada.",
    specs: { interface: "PCIe 4.0 x4", formFactor: "M.2 2280", capacity: 1000, read: 5150, write: 4900, nand: "TLC", dram: false },
  }),
  part({
    id: "kc3000-2tb", category: "storage", brand: "Kingston", name: "KC3000 2 TB", price: 980,
    summary: "NVMe rápido para trabalho pesado e biblioteca grande.", tags: ["NVMe", "2 TB", "DRAM"], quality: "excelente",
    qualityNote: "Desempenho sustentado alto; pode aquecer e se beneficia de dissipador.",
    specs: { interface: "PCIe 4.0 x4", formFactor: "M.2 2280", capacity: 2000, read: 7000, write: 7000, nand: "TLC", dram: true },
  }),

  part({
    id: "mach1-steady-750", category: "psu", brand: "Mach1", name: "Steady 750 W 80 Plus Bronze", price: 0,
    summary: "Fonte atual do Andrey, instalada antes do próximo upgrade de GPU.", tags: ["750 W", "Bronze", "atual"], quality: "básica",
    qualityNote: "Potência ampla no papel; proteções, plataforma interna e testes independentes importam mais que o selo isolado.",
    specs: { wattage: 750, efficiency: "80 Plus Bronze", modular: "não", atxVersion: "ATX", pcie5: false, qualityTier: 2, warrantyYears: 1 },
  }),
  part({
    id: "msi-a650bn", category: "psu", brand: "MSI", name: "MAG A650BN 650 W", price: 330,
    summary: "Fonte de entrada conhecida para configurações intermediárias.", tags: ["650 W", "Bronze"], quality: "boa",
    qualityNote: "Opção simples e adequada quando conectores e potência atendem ao conjunto.",
    specs: { wattage: 650, efficiency: "80 Plus Bronze", modular: "não", atxVersion: "ATX 2.x", pcie5: false, qualityTier: 3, warrantyYears: 5 },
  }),
  part({
    id: "corsair-cx750", category: "psu", brand: "Corsair", name: "CX750 750 W", price: 490,
    summary: "Fonte intermediária com boa margem para GPUs fortes.", tags: ["750 W", "Bronze"], quality: "boa",
    qualityNote: "Boa base quando o modelo e a revisão correspondem aos testes conhecidos.",
    specs: { wattage: 750, efficiency: "80 Plus Bronze", modular: "não", atxVersion: "ATX 2.x", pcie5: false, qualityTier: 4, warrantyYears: 5 },
  }),
  part({
    id: "xpg-core-850", category: "psu", brand: "ADATA XPG", name: "Core Reactor II 850 W", price: 720,
    summary: "Fonte modular moderna para GPUs de alto desempenho.", tags: ["850 W", "Gold", "ATX 3.0"], quality: "excelente",
    qualityNote: "Plataforma forte, modular e preparada para picos de GPUs atuais.",
    specs: { wattage: 850, efficiency: "80 Plus Gold", modular: "total", atxVersion: "ATX 3.0", pcie5: true, qualityTier: 5, warrantyYears: 10 },
  }),
  part({
    id: "corsair-rm1000e", category: "psu", brand: "Corsair", name: "RM1000e 1000 W", price: 1050,
    summary: "Alta potência para builds premium e grande margem.", tags: ["1000 W", "Gold", "ATX 3.0"], quality: "excelente",
    qualityNote: "Excelente, mas superdimensionada para a maioria das configurações intermediárias.",
    specs: { wattage: 1000, efficiency: "80 Plus Gold", modular: "total", atxVersion: "ATX 3.0", pcie5: true, qualityTier: 5, warrantyYears: 7 },
  }),

  part({
    id: "sate-air-120", category: "cooler", brand: "SATE", name: "Air cooler ARGB 120 mm", price: 0,
    summary: "Cooler torre atual do Andrey, com uma ventoinha.", tags: ["air cooler", "120 mm", "atual"], quality: "básica",
    qualityNote: "Adequado a CPUs eficientes; capacidade real depende do modelo exato, montagem e airflow.",
    specs: { coolerType: "torre simples", tdpCapacity: 120, height: 155, radiator: 0, sockets: ["AM4", "AM5", "LGA1700"], fans: 1, noise: 32 },
  }),
  part({
    id: "ag400", category: "cooler", brand: "DeepCool", name: "AG400", price: 180,
    summary: "Torre simples eficiente para CPUs intermediárias.", tags: ["air cooler", "torre"], quality: "excelente",
    qualityNote: "Excelente custo-benefício; confira altura máxima do gabinete.",
    specs: { coolerType: "torre simples", tdpCapacity: 180, height: 150, radiator: 0, sockets: ["AM4", "AM5", "LGA1700", "LGA1851"], fans: 1, noise: 31.6 },
  }),
  part({
    id: "ak620", category: "cooler", brand: "DeepCool", name: "AK620", price: 430,
    summary: "Dual tower para CPUs quentes e baixo ruído.", tags: ["air cooler", "dual tower"], quality: "excelente",
    qualityNote: "Alta capacidade; pode interferir com RAM alta e exige gabinete espaçoso.",
    specs: { coolerType: "dual tower", tdpCapacity: 260, height: 160, radiator: 0, sockets: ["AM4", "AM5", "LGA1700", "LGA1851"], fans: 2, noise: 28 },
  }),
  part({
    id: "aio-240", category: "cooler", brand: "Arctic", name: "Liquid Freezer III 240", price: 690,
    summary: "AIO de 240 mm para cargas térmicas elevadas.", tags: ["water cooler", "240 mm"], quality: "excelente",
    qualityNote: "Ótima refrigeração; compatibilidade do radiador e vida útil da bomba também importam.",
    specs: { coolerType: "AIO", tdpCapacity: 280, height: 0, radiator: 240, sockets: ["AM4", "AM5", "LGA1700", "LGA1851"], fans: 2, noise: 33 },
  }),

  part({
    id: "case-generic-matx", category: "case", brand: "Genérico", name: "Gabinete mATX atual", price: 0,
    summary: "Gabinete atual; medidas precisam ser confirmadas manualmente.", tags: ["mATX", "atual"], quality: "básica",
    qualityNote: "Sem modelo confirmado, comprimento de GPU e altura do cooler permanecem como pontos de atenção.",
    specs: { formFactors: ["mATX", "Mini-ITX"], gpuLength: 300, coolerHeight: 155, radiatorTop: 0, radiatorFront: 240, airflow: 2 },
  }),
  part({
    id: "deepcool-ch260", category: "case", brand: "DeepCool", name: "CH260", price: 530,
    summary: "Gabinete compacto vertical para placas mATX.", tags: ["mATX", "compacto", "mesh"], quality: "excelente",
    qualityNote: "Layout compacto interessante; medidas e posição dos componentes devem ser conferidas.",
    specs: { formFactors: ["mATX", "Mini-ITX"], gpuLength: 388, coolerHeight: 174, radiatorTop: 360, radiatorFront: 0, airflow: 5 },
  }),
  part({
    id: "montech-air-100", category: "case", brand: "Montech", name: "Air 100 ARGB", price: 420,
    summary: "mATX com frente mesh e bom fluxo de ar.", tags: ["mATX", "mesh", "ARGB"], quality: "boa",
    qualityNote: "Bom pacote para builds mATX; confirme tamanho da GPU com fans/radiador frontal.",
    specs: { formFactors: ["mATX", "Mini-ITX"], gpuLength: 330, coolerHeight: 161, radiatorTop: 240, radiatorFront: 280, airflow: 4 },
  }),
  part({
    id: "corsair-4000d", category: "case", brand: "Corsair", name: "4000D Airflow", price: 620,
    summary: "ATX espaçoso com airflow e montagem simples.", tags: ["ATX", "mesh"], quality: "excelente",
    qualityNote: "Construção sólida e bom espaço; pode exigir fans adicionais.",
    specs: { formFactors: ["ATX", "mATX", "Mini-ITX"], gpuLength: 360, coolerHeight: 170, radiatorTop: 280, radiatorFront: 360, airflow: 4 },
  }),

  part({
    id: "odyssey-g5-32", category: "monitor", brand: "Samsung", name: "Odyssey G5 32” QHD 165 Hz", price: 0,
    summary: "Monitor principal atual do Andrey.", tags: ["1440p", "165 Hz", "atual"], quality: "boa",
    qualityNote: "Meta exige GPU forte para usar 165 Hz em AAA; em competitivos é mais acessível.",
    specs: { resolution: "2560×1440", pixels: 3686400, refresh: 165, panel: "VA", size: 32, vrr: true, hdr: "HDR10" },
  }),
  part({
    id: "lg-20mk400", category: "monitor", brand: "LG", name: "20MK400H-B 19,5” 60 Hz", price: 0,
    summary: "Monitor secundário atual do Andrey.", tags: ["1366×768", "60 Hz", "atual"], quality: "boa",
    qualityNote: "Útil como tela auxiliar; resolução e frequência são básicas para jogos.",
    specs: { resolution: "1366×768", pixels: 1049088, refresh: 60, panel: "TN", size: 19.5, vrr: false, hdr: "não" },
  }),
  part({
    id: "aoc-24g2", category: "monitor", brand: "AOC", name: "24G2 24” Full HD 144 Hz", price: 900,
    summary: "Monitor 1080p de alta taxa para jogos competitivos.", tags: ["1080p", "144 Hz", "IPS"], quality: "boa",
    qualityNote: "Combinação equilibrada para GPUs intermediárias e alto FPS.",
    specs: { resolution: "1920×1080", pixels: 2073600, refresh: 144, panel: "IPS", size: 24, vrr: true, hdr: "não" },
  }),
  part({
    id: "lg-27gr75q", category: "monitor", brand: "LG", name: "UltraGear 27” QHD 165 Hz", price: 1650,
    summary: "QHD rápido em tamanho de 27 polegadas.", tags: ["1440p", "165 Hz", "IPS"], quality: "excelente",
    qualityNote: "Boa densidade e movimento; pede GPU capaz para aproveitar a frequência.",
    specs: { resolution: "2560×1440", pixels: 3686400, refresh: 165, panel: "IPS", size: 27, vrr: true, hdr: "HDR10" },
  }),
  part({
    id: "alienware-aw2523", category: "monitor", brand: "Alienware", name: "AW2523HF 24,5” Full HD 360 Hz", price: 2800,
    summary: "Tela competitiva extrema, dependente de CPU e FPS muito altos.", tags: ["1080p", "360 Hz", "eSports"], quality: "excelente",
    qualityNote: "Excelente para competição; exagerado para jogos casuais e GPUs que não sustentam alto FPS.",
    specs: { resolution: "1920×1080", pixels: 2073600, refresh: 360, panel: "Fast IPS", size: 24.5, vrr: true, hdr: "HDR" },
  }),
];

catalog.push(...expandedCatalog.filter(p => p.id !== "case-office-matx"));
catalog.push(...verifiedCatalog);

export const defaultCurrentBuild: BuildConfig = {
  name: "Meu PC atual",
  parts: {
    cpu: ["r5-3600"],
    motherboard: ["asus-prime-b550ma"],
    gpu: ["rtx3050-gainward"],
    memory: ["xpg-16-ddr4-3200"],
    storage: ["kingston-nv3-500", "lexar-sata-256", "toshiba-hdd-500"],
    psu: ["mach1-steady-750"],
    cooler: ["sate-air-120"],
    case: ["case-generic-matx"],
    monitor: ["odyssey-g5-32", "lg-20mk400"],
  },
  goal: "balanced",
  budget: 0,
  notes: "Setup principal com foco em upgrade AM4 antes da próxima placa de vídeo.",
  id: "current-andrey",
};

export const blankBuild: BuildConfig = {
  id: "draft-main",
  name: "Minha próxima configuração",
  parts: {
    cpu: ["r7-5700x"], motherboard: ["asus-prime-b550ma"], gpu: ["rx9060xt-16"],
    memory: ["xpg-16-ddr4-3200"], storage: ["kingston-nv3-500"], psu: ["mach1-steady-750"],
    cooler: ["ag400"], case: ["case-generic-matx"], monitor: ["odyssey-g5-32"],
  },
  goal: "balanced",
  budget: 4500,
  notes: "",
};

export const partsByCategory = (category: PartCategory) =>
  catalog.filter((item) => item.category === category);

export const getPart = (id?: string | null) => catalog.find((item) => item.id === id);

export const getBuildParts = (build: BuildConfig) =>
  Object.values(build.parts).flatMap((ids) => ids ?? []).map((id) => getPart(id)).filter((item): item is Part => Boolean(item));
