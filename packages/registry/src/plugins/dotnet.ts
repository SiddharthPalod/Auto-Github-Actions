import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const dotnetPlugin: AutoGhaPlugin = {
  id: "dotnet",
  name: ".NET",
  type: "language",
  detection: {
    manifests: ["*.csproj", "*.fsproj", "*.vbproj", "*.sln", "**/*.csproj", "**/*.sln"],
    extensions: [".cs", ".fs", ".vb"],
    async predicate(context, state) {
      const projFiles = context.findFiles(
        f => f.endsWith(".csproj") || f.endsWith(".fsproj") || f.endsWith(".vbproj") || f.endsWith(".sln")
      );
      if (projFiles.length > 0) {
        state.runtime.push({
          name: "dotnet",
          version: "8.0.x",
          evidence: projFiles.map(file => ({ source: file, value: ".NET project detected" }))
        });
        state.packageManager.push({
          name: "nuget",
          evidence: projFiles.map(file => ({ source: file, value: "NuGet package target" }))
        });
      } else {
        const srcFiles = context.findFiles(f => f.endsWith(".cs") || f.endsWith(".fs") || f.endsWith(".vb"));
        if (srcFiles.length > 0) {
          state.runtime.push({
            name: "dotnet",
            version: "8.0.x",
            evidence: srcFiles.slice(0, 5).map(file => ({ source: file, value: ".NET source file (.cs/.fs)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "build", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const dotnetRuntime = ctx.state.runtime.find(r => r.name === "dotnet");
      return [
        {
          kind: "uses",
          uses: "actions/setup-dotnet@v4",
          with: {
            "dotnet-version": dotnetRuntime?.version ?? "8.0.x"
          },
          source: "actions/starter-workflows:ci/dotnet.yml"
        }
      ];
    },
    build(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if ls *.sln 1> /dev/null 2>&1 || ls *.csproj 1> /dev/null 2>&1 || ls *.fsproj 1> /dev/null 2>&1; then dotnet restore && dotnet build --no-restore; else for proj in $(find . -maxdepth 5 \\( -name '*.sln' -o -name '*.csproj' -o -name '*.fsproj' \\) -not -path '*/.*' -not -path '*/bin/*' -not -path '*/obj/*' | sort -u); do echo \"Building $proj...\" && dotnet restore \"$proj\" && dotnet build \"$proj\" --no-restore; done; fi",
          source: "actions/starter-workflows:ci/dotnet.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if ls *.sln 1> /dev/null 2>&1 || ls *Test*.csproj 1> /dev/null 2>&1 || ls *test*.csproj 1> /dev/null 2>&1; then dotnet test --no-build --verbosity normal || dotnet test --verbosity normal; else for proj in $(find . -maxdepth 5 \\( -name '*.sln' -o -name '*Test*.csproj' -o -name '*test*.csproj' \\) -not -path '*/.*' -not -path '*/bin/*' -not -path '*/obj/*' | sort -u); do echo \"Testing $proj...\" && dotnet test \"$proj\" --verbosity normal; done; fi",
          source: "actions/starter-workflows:ci/dotnet.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-dotnet",
    name: ".NET CI",
    category: "test"
  }
};
