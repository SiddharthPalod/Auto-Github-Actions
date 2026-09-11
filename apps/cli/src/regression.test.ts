import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { scanRepository } from "@auto-gha/scanner";
import { planWorkflow } from "@auto-gha/planner";
import { resolvePlan } from "@auto-gha/resolver";
import { buildWorkflowIR, compileWorkflowYAML } from "@auto-gha/compiler";
import { reconcileWorkflows } from "@auto-gha/reconciliation";

describe("Regression Snapshot Test Harness", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "auto-gha-regression-"));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createFixture(name: string, files: Record<string, string>): Promise<string> {
    const fixturePath = path.join(tempDir, name);
    await fs.mkdir(fixturePath, { recursive: true });
    for (const [relativePath, content] of Object.entries(files)) {
      const fullPath = path.join(fixturePath, relativePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");
    }
    return fixturePath;
  }

  async function runPipeline(fixturePath: string) {
    const state = await scanRepository(fixturePath);
    const plan = planWorkflow(state);
    const resolvedPlan = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolvedPlan);
    const yaml = compileWorkflowYAML(ir, {
      state,
      plan,
      resolved: resolvedPlan
    });
    return { state, plan, resolvedPlan, ir, yaml };
  }

  it("Golden Snapshot: Single-Stack Node.js with pnpm and vitest", async () => {
    const fixturePath = await createFixture("single-node", {
      "package.json": JSON.stringify({
        name: "node-app",
        scripts: { test: "vitest run" },
        devDependencies: { vitest: "^3.0.0" }
      }),
      "pnpm-lock.yaml": "lockfileVersion: '9.0'",
      ".nvmrc": "20.11.0"
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Single-Stack Python with pytest", async () => {
    const fixturePath = await createFixture("single-python", {
      "requirements.txt": "pytest>=8.0.0\nrequests>=2.31.0\n",
      "src/main.py": "print('hello')",
      "tests/test_main.py": "def test_ok(): pass\n"
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Single-Stack Go", async () => {
    const fixturePath = await createFixture("single-go", {
      "go.mod": "module example.com/mygo\n\ngo 1.22\n",
      "main.go": "package main\nfunc main() {}\n"
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Single-Stack Rust", async () => {
    const fixturePath = await createFixture("single-rust", {
      "Cargo.toml": '[package]\nname = "rust-app"\nversion = "0.1.0"\nedition = "2021"\n',
      "src/main.rs": "fn main() {}\n"
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Single-Stack Java with Maven", async () => {
    const fixturePath = await createFixture("single-java", {
      "pom.xml": '<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>app</artifactId><version>1.0</version></project>'
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Single-Stack .NET with Solution", async () => {
    const fixturePath = await createFixture("single-dotnet", {
      "MyApp.sln": "Microsoft Visual Studio Solution File, Format Version 12.00",
      "MyApp/MyApp.csproj": '<Project Sdk="Microsoft.NET.Sdk"></Project>'
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Polyglot Monorepo (Node + Python + Docker)", async () => {
    const fixturePath = await createFixture("polyglot-monorepo", {
      "apps/web/package.json": JSON.stringify({ name: "web", scripts: { test: "jest" } }),
      "apps/web/package-lock.json": "{}",
      "services/api/requirements.txt": "pytest\nfastapi\n",
      "services/api/main.py": "print('api')",
      "Dockerfile": "FROM node:20\nWORKDIR /app\nCOPY . .\nCMD [\"node\", \"index.js\"]\n"
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Cloud Deployment (AWS ECS + Docker)", async () => {
    const fixturePath = await createFixture("cloud-aws", {
      "Dockerfile": "FROM alpine\n",
      "task-definition.json": JSON.stringify({ family: "my-task", containerDefinitions: [] })
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Cloud Deployment (Terraform)", async () => {
    const fixturePath = await createFixture("cloud-terraform", {
      "main.tf": 'provider "aws" { region = "us-east-1" }\n'
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Cloud Deployment (Kubernetes)", async () => {
    const fixturePath = await createFixture("cloud-k8s", {
      "k8s/deployment.yaml": 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app\n'
    });

    const { yaml } = await runPipeline(fixturePath);
    expect(yaml).toMatchSnapshot();
  });

  it("Golden Snapshot: Reconciliation of pre-existing workflow with custom steps", async () => {
    const fixturePath = await createFixture("reconciliation-test", {
      "package.json": JSON.stringify({ name: "node-app", scripts: { test: "npm test" } }),
      "package-lock.json": "{}"
    });

    const { ir } = await runPipeline(fixturePath);
    const existingYaml = `
name: CI/CD Pipeline
on:
  push:
    branches:
      - main
jobs:
  test-node:
    name: Node.js CI
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
      - name: Custom Slack Notification
        run: echo "Sending notification"
`;

    const plan = reconcileWorkflows(existingYaml, ir);
    expect(plan.status).toBe("upgrade");
    expect(plan.customStepsPreserved).toBeGreaterThanOrEqual(1);
    expect(plan.mergedIR.jobs[0].steps.some(s => s.name === "Custom Slack Notification")).toBe(true);
  });
});
