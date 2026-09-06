import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const dotnetDetector: Detector = {
  name: "dotnet",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const projFiles = context.findFiles(f => f.endsWith(".csproj") || f.endsWith(".fsproj") || f.endsWith(".sln"));
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
    }
  }
};
