/** Scene-space mounting references for a generic left-side-open tower.
 * Coordinates are illustrative; never use them for physical clearance validation.
 */
export type Point3 = [number, number, number];
export const mount = {
  motherboard: [-.45,.25,-.79] as Point3,
  cpuSocket: [-.65,.38,-.70] as Point3,
  pcieX16: [-.45,-.43,-.63] as Point3,
  gpu: [-.25,-.59,-.29] as Point3,
  psu: [-.95,-1.52,-.23] as Point3,
  frontFans: [1.48,0,.05] as Point3,
} as const;
export const addPoint = (a: Point3,b: Point3): Point3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
