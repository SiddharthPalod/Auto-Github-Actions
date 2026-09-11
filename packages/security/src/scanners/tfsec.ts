import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const tfsecScanner: ScannerPlugin = {
  id: "tfsec",
  name: "tfsec IaC Scanner",
  icon: "📜",
  description: "Static analysis for Terraform templates security misconfigurations",
  jobKey: "tfsec",
  jobName: "Terraform IaC Security (tfsec)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.infrastructure.some(i => i.name === "terraform");
  },
  buildSteps(scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Scan Terraform IaC with tfsec",
        uses: "aquasecurity/tfsec-action@v1.0.3",
        with: {
          sarif_file: "tfsec.sarif",
          "soft-fail": !scanner.failOnError
        }
      },
      {
        name: "Upload tfsec scan results",
        if: "always() && hashFiles('tfsec.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "tfsec.sarif"
        }
      }
    ];
  }
};
