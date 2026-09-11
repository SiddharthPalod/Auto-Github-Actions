import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const ghcrPlugin: AutoGhaPlugin = {
  id: "ghcr",
  name: "Publish Docker Image (GHCR)",
  type: "deployment",
  detection: {
    manifests: [],
    async predicate(_context, _state) {
      // Intent comes from Docker infrastructure detection
    }
  },
  provides: ["deploy"],
  resolvers: {
    deploy(ctx: ResolverContext): StepIR[] {
      const dockerInfra = ctx.state.infrastructure.find(i => i.name === "docker");
      const dockerfile = dockerInfra?.evidence?.[0]?.source ?? "Dockerfile";

      return [
        {
          id: "ghcr-login",
          name: "Log into registry ghcr.io",
          kind: "uses",
          uses: "docker/login-action@v3",
          with: {
            registry: "ghcr.io",
            username: "${{ github.actor }}",
            password: "${{ secrets.GITHUB_TOKEN }}"
          },
          source: "actions/starter-workflows:deployments/docker-publish.yml"
        },
        {
          id: "ghcr-meta",
          name: "Extract metadata (tags, labels) for Docker",
          kind: "uses",
          uses: "docker/metadata-action@v5",
          with: {
            images: "ghcr.io/${{ github.repository }}"
          },
          source: "actions/starter-workflows:deployments/docker-publish.yml"
        },
        {
          id: "ghcr-push",
          name: "Build and push Docker image",
          kind: "uses",
          uses: "docker/build-push-action@v6",
          with: {
            push: true,
            tags: "${{ steps.ghcr-meta.outputs.tags }}",
            labels: "${{ steps.ghcr-meta.outputs.labels }}",
            file: dockerfile,
            context: "."
          },
          source: "actions/starter-workflows:deployments/docker-publish.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-ghcr",
    name: "Publish Docker Image (GHCR)",
    category: "deploy"
  }
};
