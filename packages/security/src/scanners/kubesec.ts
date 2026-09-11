import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const kubesecScanner: ScannerPlugin = {
  id: "kubesec",
  name: "Kubesec",
  jobKey: "kubesec",
  jobName: "Kubernetes Manifest Security (Kubesec)",
  timeoutMinutes: 10,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Kubesec scan",
        uses: "controlplaneio/kubesec-action@v0.0.2",
        with: {
          "scan-dir": "."
        }
      }
    ];
  }
};
