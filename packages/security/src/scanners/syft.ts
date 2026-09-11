import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const syftScanner: ScannerPlugin = {
  id: "syft",
  name: "Anchore Syft SBOM",
  icon: "📋",
  description: "Software Bill of Materials (SBOM) generation for containers & files",
  jobKey: "syft",
  jobName: "Generate SBOM (Anchore Syft)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.infrastructure.some(i => i.name === "docker" || i.evidence.some(e => e.source.toLowerCase().includes("dockerfile"))) || state.packageManager.length > 0;
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Generate SBOM with Syft",
        uses: "anchore/sbom-action@v0",
        with: {
          format: "spdx-json",
          output_file: "sbom.spdx.json"
        }
      }
    ];
  }
};
