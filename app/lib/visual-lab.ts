import type { BuildConfig } from "@/app/lib/types";

/** Read-only GPU scenario for the lab: preserves every other category and never mutates a saved build. */
export function simulateLabGpu(source: BuildConfig, gpuId: string | null): BuildConfig {
  return {
    ...source,
    parts: {
      ...source.parts,
      gpu: gpuId ? [gpuId] : [],
    },
  };
}

export function labBuildLabel(source: "current" | "draft"): string {
  return source === "current" ? "Meu PC atual" : "Montagem do Montador";
}
