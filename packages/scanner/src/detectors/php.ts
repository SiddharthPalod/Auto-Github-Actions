import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const phpDetector: Detector = {
  name: "php",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const composerFiles = context.findFiles(f => f.endsWith("composer.json"));
    if (composerFiles.length > 0) {
      state.runtime.push({
        name: "php",
        version: "8.2",
        evidence: composerFiles.map(file => ({ source: file, value: "PHP Composer project detected" }))
      });
      state.packageManager.push({
        name: "composer",
        evidence: composerFiles.map(file => ({ source: file, value: "composer.json" }))
      });
    }

    if (context.findFiles(f => f.endsWith("artisan")).length > 0) {
      state.frameworks.push({
        name: "laravel",
        evidence: [{ source: "artisan", value: "Laravel framework detected" }]
      });
    }

    if (context.findFiles(f => f.endsWith("bin/console")).length > 0) {
      state.frameworks.push({
        name: "symfony",
        evidence: [{ source: "bin/console", value: "Symfony framework detected" }]
      });
    }
  }
};
