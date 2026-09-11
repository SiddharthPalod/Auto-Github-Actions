import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const goPlugin: AutoGhaPlugin = {
  id: "go",
  name: "Go",
  type: "language",
  detection: {
    manifests: ["go.mod", "go.sum", "**/go.mod"],
    extensions: [".go"],
    async predicate(context, state) {
      const goMods = context.findFiles(f => f.endsWith("go.mod"));
      if (goMods.length > 0) {
        for (const file of goMods) {
          const content = await context.readFile(file);
          const match = content ? /^go\s+([^\s]+)/m.exec(content) : null;
          const version = match ? match[1] : undefined;

          state.runtime.push({
            name: "go",
            version,
            evidence: [{ source: file, value: version ? `go ${version}` : "go.mod module detected" }]
          });
        }
      } else {
        const goFiles = context.findFiles(f => f.endsWith(".go"));
        if (goFiles.length > 0) {
          state.runtime.push({
            name: "go",
            evidence: goFiles.slice(0, 5).map(file => ({ source: file, value: "Go source file (.go)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "build", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const goRuntime = ctx.state.runtime.find(r => r.name === "go");
      return [
        {
          kind: "uses",
          uses: "actions/setup-go@v5",
          with: { "go-version": goRuntime?.version ?? "1.22" },
          source: "actions/starter-workflows:ci/go.yml"
        }
      ];
    },
    build(ctx: ResolverContext): StepIR[] {
      const goRuntime = ctx.state.runtime.find(r => r.name === "go");
      return [
        {
          kind: "uses",
          uses: "actions/setup-go@v5",
          with: { "go-version": goRuntime?.version ?? "1.22" },
          source: "actions/starter-workflows:ci/go.yml"
        },
        {
          kind: "run",
          run: "if [ -f go.mod ]; then go build -v ./...; else for mod in $(find . -name 'go.mod' -not -path '*/.*'); do (cd \"$(dirname \"$mod\")\" && echo \"Building $(dirname \"$mod\")...\" && go build -v ./...); done; fi",
          source: "actions/starter-workflows:ci/go.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if [ -f go.mod ]; then go test -v ./...; else for mod in $(find . -name 'go.mod' -not -path '*/.*'); do (cd \"$(dirname \"$mod\")\" && echo \"Testing $(dirname \"$mod\")...\" && go test -v ./...); done; fi",
          source: "actions/starter-workflows:ci/go.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-go",
    name: "Go CI",
    category: "test"
  }
};
