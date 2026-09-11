import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const checkmarxScanner: ScannerPlugin = {
  id: "checkmarx",
  name: "Checkmarx AST SAST",
  icon: "🏢",
  description: "Enterprise-grade static application security testing",
  jobKey: "checkmarx",
  jobName: "Checkmarx AST Security Scan",
  timeoutMinutes: 20,
  isApplicable(_state: ProjectState) {
    return true;
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Checkmarx AST Scan",
        uses: "checkmarx/ast-github-action@main",
        with: {
          base_uri: "${{ secrets.CX_BASE_URI }}",
          cx_tenant: "${{ secrets.CX_TENANT }}",
          cx_client_id: "${{ secrets.CX_CLIENT_ID }}",
          cx_client_secret: "${{ secrets.CX_CLIENT_SECRET }}",
          additional_params: "--report-format sarif --output-name checkmarx.sarif"
        }
      },
      {
        name: "Upload Checkmarx AST results",
        if: "always() && hashFiles('checkmarx.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "checkmarx.sarif"
        }
      }
    ];
  }
};
