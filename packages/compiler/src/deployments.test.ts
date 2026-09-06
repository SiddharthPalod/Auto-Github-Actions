import { describe, it, expect } from "vitest";
import type { ProjectState } from "@auto-gha/state";
import { planWorkflow } from "@auto-gha/planner";
import { resolvePlan } from "@auto-gha/resolver";
import { buildWorkflowIR, validateWorkflowIR, compileWorkflowYAML } from "./index.js";

describe("Phase 8 - Continuous Deployment & Cloud Targets", () => {
  it("plans, resolves, and compiles AWS ECS deployment guarded by test-node DAG dependency", () => {
    const awsState: ProjectState = {
      runtime: [{ name: "node", evidence: [{ source: "package.json", value: "Node" }] }],
      packageManager: [{ name: "npm", evidence: [{ source: "package-lock.json", value: "npm" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: [
        { name: "aws", evidence: [{ source: "task-definition.json", value: "AWS" }] }
      ]
    };

    const plan = planWorkflow(awsState);
    expect(plan.matchedRules).toContain("deploy-aws");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);

    const deployJob = ir.jobs.find(j => j.id === "deploy-aws");
    expect(deployJob).toBeDefined();
    expect(deployJob?.needs).toContain("test-node");
    expect(deployJob?.environment).toBe("production");
    expect(deployJob?.if).toBe("github.ref == 'refs/heads/main' && github.event_name == 'push'");

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("aws-actions/configure-aws-credentials@v4");
    expect(yaml).toContain("aws-actions/amazon-ecs-deploy-task-definition@v2");
    expect(yaml).toContain("environment: production");
  });

  it("plans, resolves, and compiles GCP Cloud Run deployment with DAG dependencies", () => {
    const gcpState: ProjectState = {
      runtime: [{ name: "python", evidence: [{ source: "requirements.txt", value: "Python" }] }],
      packageManager: [{ name: "pip", evidence: [{ source: "requirements.txt", value: "pip" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: [
        { name: "gcp", evidence: [{ source: "cloudrun.yaml", value: "GCP" }] }
      ]
    };

    const plan = planWorkflow(gcpState);
    expect(plan.matchedRules).toContain("deploy-gcp");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);

    const deployJob = ir.jobs.find(j => j.id === "deploy-gcp");
    expect(deployJob).toBeDefined();
    expect(deployJob?.needs).toContain("test-python");

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("google-github-actions/deploy-cloudrun@v2");
  });

  it("plans, resolves, and compiles Azure, Kubernetes, and Terraform CD jobs", () => {
    const fullState: ProjectState = {
      runtime: [{ name: "go", evidence: [{ source: "go.mod", value: "Go" }] }],
      packageManager: [{ name: "gomod", evidence: [{ source: "go.mod", value: "gomod" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: [
        { name: "azure", evidence: [{ source: "azure-pipelines.yml", value: "Azure" }] },
        { name: "kubernetes", evidence: [{ source: "Chart.yaml", value: "Helm" }] },
        { name: "terraform", evidence: [{ source: "main.tf", value: "Terraform" }] }
      ]
    };

    const plan = planWorkflow(fullState);
    expect(plan.matchedRules).toContain("deploy-azure");
    expect(plan.matchedRules).toContain("deploy-k8s");
    expect(plan.matchedRules).toContain("deploy-terraform");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);

    expect(ir.jobs.some(j => j.id === "deploy-azure")).toBe(true);
    expect(ir.jobs.some(j => j.id === "deploy-k8s")).toBe(true);
    expect(ir.jobs.some(j => j.id === "deploy-terraform")).toBe(true);

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("azure/webapps-deploy@v3");
    expect(yaml).toContain("azure/setup-helm@v4.2.0");
    expect(yaml).toContain("hashicorp/setup-terraform@v3");
    expect(yaml).toContain("terraform apply -auto-approve");
  });
});

