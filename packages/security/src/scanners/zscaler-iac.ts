import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const zscalerIacScanner: ScannerPlugin = {
  id: "zscaler-iac",
  name: "Zscaler IaC Scan",
  icon: "☁️",
  description: "Zscaler IaC security scanning for Terraform and Kubernetes",
  jobKey: "zscaler-iac",
  jobName: "Infrastructure as Code Security (Zscaler)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.infrastructure.some(i => i.name === "terraform" || i.name === "kubernetes");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Zscaler IaC Scan",
        uses: "ZscalerCWP/Zscaler-IaC-Action@v1",
        with: {
          "client-id": "${{ secrets.ZSCALER_CLIENT_ID }}",
          "client-secret": "${{ secrets.ZSCALER_CLIENT_SECRET }}",
          "fail-build": false,
          sarif: "zscaler-results.sarif"
        }
      },
      {
        name: "Upload Zscaler IaC results",
        if: "always() && hashFiles('zscaler-results.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "zscaler-results.sarif"
        }
      }
    ];
  }
};
