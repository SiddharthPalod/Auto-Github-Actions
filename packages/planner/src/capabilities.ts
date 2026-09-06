import type {
  ProjectState
} from "@auto-gha/state";

import type {
  CapabilityId,
  ResolvedCapability
} from "./types.js";

export function resolveCapabilities(
  state: ProjectState
): ResolvedCapability[] {
  const capabilities: ResolvedCapability[] = [];

  for (const runtime of state.runtime) {
    const id =
      `runtime.${runtime.name}` as CapabilityId;

    capabilities.push({
      id,

      confidence: 1,

      version: runtime.version,

      evidence: runtime.evidence.map(
        evidence => ({
          source: evidence.source,
          reason: evidence.value
        })
      )
    });
  }

  for (const manager of state.packageManager) {
    const id =
      `package.${manager.name}` as CapabilityId;

    capabilities.push({
      id,

      confidence: 1,

      evidence: manager.evidence.map(
        evidence => ({
          source: evidence.source,
          reason: evidence.value
        })
      )
    });
  }

  const groups: Array<{
    source: keyof Pick<
      ProjectState,
      | "frameworks"
      | "testing"
      | "tooling"
      | "infrastructure"
    >;

    prefix: string;
  }> = [
    {
      source: "frameworks",
      prefix: "framework"
    },
    {
      source: "testing",
      prefix: "test"
    },
    {
      source: "tooling",
      prefix: "tool"
    },
    {
      source: "infrastructure",
      prefix: "infra"
    }
  ];

  for (const group of groups) {
    for (const item of state[group.source]) {
      const id =
        `${group.prefix}.${item.name}` as CapabilityId;

      capabilities.push({
        id,

        confidence: 1,

        evidence: item.evidence.map(
          evidence => ({
            source: evidence.source,
            reason: evidence.value
          })
        )
      });
    }
  }

  return deduplicateCapabilities(
    capabilities
  );
}

function deduplicateCapabilities(
  capabilities: ResolvedCapability[]
): ResolvedCapability[] {
  const map =
    new Map<
      CapabilityId,
      ResolvedCapability
    >();

  for (const capability of capabilities) {
    const existing =
      map.get(capability.id);

    if (!existing) {
      map.set(
        capability.id,
        capability
      );

      continue;
    }

    existing.evidence.push(
      ...capability.evidence
    );

    existing.confidence =
      Math.max(
        existing.confidence,
        capability.confidence
      );
  }

  return [...map.values()];
}
