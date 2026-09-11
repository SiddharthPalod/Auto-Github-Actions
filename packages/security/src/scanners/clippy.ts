import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const clippyScanner: ScannerPlugin = {
  id: "clippy",
  name: "Clippy Rust Linter",
  icon: "🦀",
  description: "Rust static analysis and security linter",
  jobKey: "clippy",
  jobName: "Rust Security & Lints (Clippy)",
  timeoutMinutes: 15,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "rust");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Run Clippy",
        uses: "actions-rs/clippy-check@v1",
        with: {
          token: "${{ secrets.GITHUB_TOKEN }}",
          args: "--all-targets -- -D warnings"
        }
      }
    ];
  }
};
