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
  const xrayShell = mode === "xray" && id === "case";
  const opacity = xrayShell ? Math.min(baseOpacity, .13) : baseOpacity;
  // Transparent chassis and acrylic covers must never intercept clicks on hardware.
  const pickable = !decorative && !xrayShell && opacity >= .50;
  return { visible: true, opacity, pickable, depthWrite: opacity >= .98 };
}

export function canDisplayPanel(mode: VisualMode, isolate: boolean, selected: VisualPart, enabled: boolean) {
  // X-ray replaces the panel with a transparent structural outline.
  return enabled && mode !== "xray" && (!isolate || selected === "case");
}

export function modeDescription(mode: VisualMode, isolate: boolean): string {
  if (isolate) return "Isolamento ativo: apenas a peça selecionada deve aparecer. Desative a opção para ver a montagem completa.";
  if (mode === "xray") return "Raio-X: gabinete semitransparente; componentes internos permanecem opacos e selecionáveis.";
  if (mode === "exploded") return "Vista explodida: cada componente está separado de seu ponto de montagem. Linhas pontilhadas indicam os encaixes.";
  if (mode === "airflow") return "Fluxo ilustrativo: setas azuis representam entrada de ar e laranjas representam exaustão.";
  return "Montagem reunida: selecione uma peça na cena ou nos controles abaixo.";
}
