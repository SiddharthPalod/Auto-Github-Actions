import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const clippyScanner: ScannerPlugin = {
  id: "clippy",
  name: "Clippy",
  jobKey: "clippy",
  jobName: "Rust Security & Lints (Clippy)",
  timeoutMinutes: 15,
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
