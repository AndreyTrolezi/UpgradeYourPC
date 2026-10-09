/** Pure visual-state rules for the experimental PC viewer.
 * Keeps picking and visibility consistent between solid pieces and fans.
 */
export type VisualPart = "case" | "motherboard" | "gpu" | "cooler" | "ram" | "psu";
export type VisualMode = "assembled" | "exploded" | "xray" | "airflow";
export type Presentation = { visible: boolean; opacity: number; pickable: boolean; depthWrite: boolean };

export function presentPart(
  id: VisualPart,
  selected: VisualPart,
  mode: VisualMode,
  isolate: boolean,
  baseOpacity = 1,
  decorative = false,
): Presentation {
  if (isolate && selected !== id) {
    return { visible: false, opacity: 0, pickable: false, depthWrite: false };
  }
  // X-ray is an inspection tool: the selected component stays solid, while
  // other components become ghosted. Unlike isolation, they remain visible.
  const xrayShell = mode === "xray" && id === "case";
  const xrayGhost = mode === "xray" && id !== selected;
  const opacity = xrayShell ? Math.min(baseOpacity, .09)
    : xrayGhost ? Math.min(baseOpacity, .20)
    : baseOpacity;
  // Ghosts and glass must not block clicks through to the selected component.
  const pickable = !decorative && !xrayShell && !xrayGhost && opacity >= .50;
  return { visible: true, opacity, pickable, depthWrite: opacity >= .98 };
}

export function canDisplayPanel(mode: VisualMode, isolate: boolean, selected: VisualPart, enabled: boolean) {
  // X-ray replaces the panel with a transparent structural outline.
  return enabled && mode !== "xray" && (!isolate || selected === "case");
}

export function modeDescription(mode: VisualMode, isolate: boolean): string {
  if (isolate) return "Isolamento ativo: apenas a peça selecionada deve aparecer. Desative a opção para ver a montagem completa.";
  if (mode === "xray") return "Raio-X: a peça selecionada fica sólida e destacada; as outras aparecem como sombras transparentes. Selecione outra peça nos botões abaixo para inspecioná-la.";
  if (mode === "exploded") return "Vista explodida: componentes separados fora do gabinete. Ajuste a distância e siga as linhas pontilhadas até os pontos de instalação.";
  if (mode === "airflow") return "Fluxo ilustrativo: setas azuis representam entrada de ar e laranjas representam exaustão.";
  return "Montagem reunida: selecione uma peça na cena ou nos controles abaixo.";
}
