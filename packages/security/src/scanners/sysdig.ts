import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const sysdigScanner: ScannerPlugin = {
  id: "sysdig",
  name: "Sysdig Secure",
  jobKey: "sysdig",
  jobName: "Container Security (Sysdig)",
  timeoutMinutes: 15,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Sysdig Inline Scan",
        uses: "sysdiglabs/scan-action@v3",
        with: {
          "image-tag": "${{ env.IMAGE_NAME || 'app:latest' }}",
          "sysdig-secure-token": "${{ secrets.SYSDIG_SECURE_TOKEN }}",
          "output-format": "sarif",
          "output-file": "sysdig.sarif"
        }
      },
      {
        name: "Upload Sysdig scan results",
        if: "always() && hashFiles('sysdig.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "sysdig.sarif"
        }
      }
    ];
  }
};
