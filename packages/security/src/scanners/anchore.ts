import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const anchoreScanner: ScannerPlugin = {
  id: "anchore",
  name: "Anchore Grype Vulnerability Scanner",
  icon: "⚓",
  description: "Vulnerability and policy scanner for container images & dependencies",
  jobKey: "anchore",
  jobName: "Vulnerability Scan (Anchore Grype)",
  timeoutMinutes: 15,
  isApplicable(state: ProjectState) {
    return state.infrastructure.some(i => i.name === "docker" || i.evidence.some(e => e.source.toLowerCase().includes("dockerfile")));
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Anchore Grype Vulnerability Scanner",
        uses: "anchore/scan-action@v4",
        with: {
          path: ".",
          "fail-build": false,
          "output-format": "sarif",
          severity: "high"
        }
      },
      {
        name: "Upload Anchore scan results",
        if: "always() && hashFiles('results.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "results.sarif"
        }
      }
    ];
  }
};
