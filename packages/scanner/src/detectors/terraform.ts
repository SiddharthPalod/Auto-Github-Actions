import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const terraformDetector: Detector = {
  name: "terraform",
  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const tfFiles = context.findFiles(f => {
      const lower = f.toLowerCase();
      return (
        lower.endsWith(".tf") ||
        lower.endsWith(".tfvars") ||
        lower.endsWith("terragrunt.hcl")
      );
    });

    if (tfFiles.length > 0) {
      state.infrastructure.push({
        name: "terraform",
        evidence: tfFiles.map(file => ({
          source: file,
          value: "Terraform Infrastructure as Code detected"
        }))
      });
    }
  }
};
