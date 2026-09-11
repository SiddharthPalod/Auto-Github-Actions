import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const sobelowScanner: ScannerPlugin = {
  id: "sobelow",
  name: "Sobelow Elixir/Phoenix SAST",
  icon: "🧪",
  description: "Security-focused static analysis for Elixir & Phoenix framework",
  jobKey: "sobelow",
  jobName: "Elixir / Phoenix Security (Sobelow)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "elixir") || state.frameworks.some(f => f.name === "phoenix");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Sobelow",
        uses: "sobelow/action@v1"
      }
    ];
  }
};
