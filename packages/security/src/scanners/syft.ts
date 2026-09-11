import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const syftScanner: ScannerPlugin = {
  id: "syft",
  name: "Syft SBOM",
  jobKey: "syft",
  jobName: "Generate SBOM (Anchore Syft)",
  timeoutMinutes: 10,
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
