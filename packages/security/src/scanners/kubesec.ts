import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const kubesecScanner: ScannerPlugin = {
  id: "kubesec",
  name: "Kubesec Kubernetes Security",
  icon: "☸️",
  description: "Security risk analysis for Kubernetes manifests and configurations",
  jobKey: "kubesec",
  jobName: "Kubernetes Manifest Security (Kubesec)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.infrastructure.some(i => i.name === "kubernetes");
  },
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
