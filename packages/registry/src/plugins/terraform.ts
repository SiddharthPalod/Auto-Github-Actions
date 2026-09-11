import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const terraformPlugin: AutoGhaPlugin = {
  id: "terraform",
  name: "Terraform",
  type: "deployment",
  detection: {
    manifests: ["*.tf", "*.tfvars", "terragrunt.hcl", "**/*.tf"],
    extensions: [".tf", ".tfvars"],
    async predicate(context, state) {
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
  },
  provides: ["deploy"],
  resolvers: {
    deploy(_ctx: ResolverContext): StepIR[] {
      return [
        {
          id: "setup-terraform",
          name: "Setup Terraform",
          kind: "uses",
          uses: "hashicorp/setup-terraform@v3",
          source: "actions/starter-workflows:deployments/terraform.yml"
        },
        {
          id: "terraform-init",
          name: "Terraform Init",
          kind: "run",
          run: "terraform init",
          source: "actions/starter-workflows:deployments/terraform.yml"
        },
        {
          id: "terraform-apply",
          name: "Terraform Apply",
          kind: "run",
          run: "terraform apply -auto-approve",
          source: "actions/starter-workflows:deployments/terraform.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "deploy-terraform",
    name: "Terraform Apply",
    category: "deploy"
  }
};
