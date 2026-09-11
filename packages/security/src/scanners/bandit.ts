import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const banditScanner: ScannerPlugin = {
  id: "bandit",
  name: "Bandit",
  jobKey: "bandit",
  jobName: "Python Security Scan (Bandit)",
  timeoutMinutes: 10,
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Set up Python",
        uses: "actions/setup-python@v5",
        with: { "python-version": "3.x" }
      },
      {
        name: "Run Bandit Security Linter",
        run: "pip install bandit && bandit -r . -f custom --msg-template '{abspath}:{line}: [{test_id}] {msg}' || true"
      }
    ];
  }
};
