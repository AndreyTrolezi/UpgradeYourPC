import type { Part } from "@/app/lib/types";
export type AssemblyStep = { title: string; instruction: string; caution: string };
export function gpuInstallationManual(gpu?: Part): AssemblyStep[] {
  return [
    { title: "Desligar e preparar", instruction: "Desligue o computador, desligue a fonte e desconecte o cabo de energia. Aguarde a descarga dos componentes e trabalhe em superfície adequada.", caution: "Nunca instale componentes com o computador energizado." },
    { title: "Conferir espaço e slot", instruction: "Compare as medidas oficiais da GPU com o gabinete e localize o slot PCIe x16 principal da placa-mãe.", caution: "Sem medidas oficiais, o encaixe físico permanece não confirmado." },
    { title: "Preparar o gabinete", instruction: "Remova as tampas traseiras correspondentes à espessura da placa e abra a trava do slot PCIe, sem forçar.", caution: "Guarde os parafusos e evite contato com os terminais." },
    { title: "Instalar a placa", instruction: `Alinhe ${gpu?.name ?? "a placa de vídeo"} ao slot e pressione uniformemente até o encaixe completo; fixe o suporte traseiro.`, caution: "Não force a placa se houver resistência anormal." },
    { title: "Alimentação e teste", instruction: "Conecte os cabos PCIe exigidos pelo modelo e pela fonte, feche o gabinete, conecte o monitor à GPU e ligue para testar.", caution: "Não presuma conectores ou potência: confira o manual da placa e da fonte." },
  ];
}
