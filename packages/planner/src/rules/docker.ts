import type { Rule } from "../types.js";
import { findCapability, formatEvidence, noMatch } from "./helpers.js";

export const dockerBuildRule: Rule = {
  id: "docker-build",
  description: "Build container images when Docker infrastructure is detected.",

  evaluate(_state, capabilities) {
    const docker = findCapability(capabilities, "infra.docker");
    const compose = findCapability(capabilities, "infra.docker-compose");

    if (!docker && !compose) {
      return noMatch();
    }

    const dockerfile = docker?.evidence?.[0]?.source ?? "Dockerfile";
    const context = dockerfile.includes("/") ? dockerfile.substring(0, dockerfile.lastIndexOf("/")) : ".";

    return {
      matched: true,
      actions: [
        {
          id: "docker-build",
          type: "docker.build",
          inputs: { file: dockerfile, context },
          reason: "Docker infrastructure detected.",
          sourceRule: "docker-build"
        }
      ],
      reasons: ["Docker infrastructure detected.", ...formatEvidence(docker, compose)]
    };
  }
};