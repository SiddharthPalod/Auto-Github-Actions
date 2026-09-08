import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const rustDetector: Detector = {
  name: "rust",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    // 1. Find all Cargo.toml files in the repo
    const cargoFiles = context.findFiles(f => f.endsWith("Cargo.toml"));
    for (const file of cargoFiles) {
      state.runtime.push({
        name: "rust",
        evidence: [{ source: file, value: "Cargo project detected" }]
      });
    }
    // 2. Check for Cargo.lock
    if (context.findFiles(f => f.endsWith("Cargo.lock")).length > 0) {
      state.packageManager.push({
        name: "cargo",
        evidence: [{ source: "Cargo.lock", value: "lockfile detected" }]
      });
    }

    if (cargoFiles.length === 0) {
      const rsFiles = context.findFiles(f => f.endsWith(".rs"));
      if (rsFiles.length > 0) {
        state.runtime.push({
          name: "rust",
          evidence: rsFiles.slice(0, 5).map(file => ({ source: file, value: "Rust source file (.rs)" }))
        });
      }
    }
  }
};