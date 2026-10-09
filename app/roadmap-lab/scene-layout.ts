/**
 * Single coordinate system for the generic ATX-style showcase.
 * X: rear (-) to front (+); Y: floor (-) to roof (+); Z: motherboard tray (-) to open side (+).
 *
 * All values are illustrative scene units, NOT millimeters. Never treat these
 * anchors as proof that a retail component fits in a specific case.
 */
export type Point3 = [number, number, number];

export const SHOWCASE = {
  width: 3.6,
  height: 4.2,
  depth: 2.15,
  frontX: 1.8,
  rearX: -1.8,
  trayZ: -0.98,
  sideZ: 1.075,
  shroudY: -1.14,
} as const;

export const ANCHORS = {
  motherboard: [-0.42, 0.3, -0.80] as Point3,
  cpuSocket: [-0.70, 0.48, -0.65] as Point3,
  ramA2: [0.34, 0.63, -0.65] as Point3,
  ramB2: [0.56, 0.63, -0.65] as Point3,
  pcieX16: [-1.37, -0.54, -0.65] as Point3,
  psuBay: [-0.94, -1.55, -0.28] as Point3,
  frontFans: [
    [1.56, 1.15, -0.02],
    [1.56, 0.28, -0.02],
    [1.56, -0.59, -0.02],
  ] as Point3[],
  rearFan: [-1.64, 1.12, 0.02] as Point3,
} as const;

/** Displacements affect the exploded diagram only, never mounted positions. */
export const EXPLODED = {
  // Separate components into non-overlapping inspection regions, outside the
  // chassis. Render the cabinet only as a wireframe in this mode.
  motherboard: [-1.45, 0.05, 1.70] as Point3,
  cpu: [-2.65, 0.55, 2.75] as Point3,
  memory: [2.45, 0.85, 2.20] as Point3,
  gpu: [-0.25, -1.50, 2.65] as Point3,
  psu: [2.40, -2.75, 2.60] as Point3,
} as const;

export function placed(anchor: Point3, exploded: boolean, displacement: Point3 = [0, 0, 0], strength = 1): Point3 {
  if (!exploded) return [...anchor];
  return [
    anchor[0] + displacement[0] * strength,
    anchor[1] + displacement[1] * strength,
    anchor[2] + displacement[2] * strength,
  ];
}

export function inBounds([x, y, z]: Point3, epsilon = 0): boolean {
  return Math.abs(x) <= SHOWCASE.width / 2 + epsilon &&
    Math.abs(y) <= SHOWCASE.height / 2 + epsilon &&
    Math.abs(z) <= SHOWCASE.depth / 2 + epsilon;
}
