import type { ProjectState } from "@auto-gha/state";
import type { ScannerPlugin } from "./types.js";
import type { CodeScanningTargetConfig } from "../types.js";

export const brakemanScanner: ScannerPlugin = {
  id: "brakeman",
  name: "Brakeman Ruby/Rails SAST",
  icon: "💎",
  description: "Static analysis security vulnerability scanner for Ruby on Rails",
  jobKey: "brakeman",
  jobName: "Ruby / Rails Security Scan (Brakeman)",
  timeoutMinutes: 10,
  isApplicable(state: ProjectState) {
    return state.runtime.some(r => r.name === "ruby") || state.frameworks.some(f => f.name === "rails");
  },
  buildSteps(_scanner: CodeScanningTargetConfig) {
    return [
      {
        name: "Set up Ruby",
        uses: "ruby/setup-ruby@v1",
        with: { "ruby-version": "3.2" }
      },
      {
        name: "Run Brakeman",
        uses: "brakeman/brakeman-action@v1",
        with: {
          sarif_file: "brakeman.sarif"
        }
      },
      {
        name: "Upload Brakeman scan results",
        if: "always() && hashFiles('brakeman.sarif') != ''",
        uses: "github/codeql-action/upload-sarif@v3",
        with: {
          sarif_file: "brakeman.sarif"
        }
      }
    ];
  }
};
