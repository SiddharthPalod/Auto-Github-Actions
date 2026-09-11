import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

const COMPOSE_REGEX = /(^|\/)(docker-)?compose\.(yml|yaml)$/i;

export const dockerPlugin: AutoGhaPlugin = {
  id: "docker",
  name: "Docker",
  type: "infrastructure",
  detection: {
    manifests: ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml", "**/Dockerfile"],
    async predicate(context, state) {
      const dockerfiles = context.findFiles(
        f => f.endsWith("Dockerfile") || f.includes("/Dockerfile.") || f.startsWith("Dockerfile.")
      );

      for (const df of dockerfiles) {
        state.infrastructure.push({
          name: "docker",
          evidence: [{ source: df, value: "Dockerfile detected" }]
        });
      }

      const composeFiles = context.findFiles(f => COMPOSE_REGEX.test(f));
      for (const cf of composeFiles) {
        state.infrastructure.push({
          name: "docker-compose",
          evidence: [{ source: cf, value: "Compose configuration detected" }]
        });
      }
    }
  },
  provides: ["build"],
  resolvers: {
    build(ctx: ResolverContext): StepIR[] {
      const dockerInfra = ctx.state.infrastructure.find(i => i.name === "docker");
      const dockerfile = dockerInfra?.evidence?.[0]?.source ?? "Dockerfile";

      return [
        {
          kind: "uses",
          uses: "docker/build-push-action@v6",
          with: {
            push: false,
            file: dockerfile,
            context: "."
          },
          source: "actions/starter-workflows:ci/docker-image.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "build-docker",
    name: "Docker Build",
    category: "build"
  }
};
