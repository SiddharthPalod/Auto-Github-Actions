import { describe, it, expect } from "vitest";
import type { ProjectState } from "@auto-gha/state";
import { planWorkflow } from "@auto-gha/planner";
import { resolvePlan } from "@auto-gha/resolver";
import { buildWorkflowIR, validateWorkflowIR, compileWorkflowYAML } from "./index.js";

describe("Expanded Starter Workflows Ecosystems", () => {
  it("plans, resolves, and compiles Java Maven and Gradle projects", () => {
    const mavenState: ProjectState = {
      runtime: [{ name: "java", version: "17", evidence: [{ source: "pom.xml", value: "Maven" }] }],
      packageManager: [{ name: "maven", evidence: [{ source: "pom.xml", value: "pom" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const plan = planWorkflow(mavenState);
    expect(plan.matchedRules).toContain("java-ci");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);
    expect(ir.jobs.some(j => j.id === "test-java")).toBe(true);

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("setup-java@v4");
    expect(yaml).toContain("mvn -B package --file pom.xml");
  });

  it("plans, resolves, and compiles .NET / C# projects", () => {
    const dotnetState: ProjectState = {
      runtime: [{ name: "dotnet", version: "8.0.x", evidence: [{ source: "App.csproj", value: ".NET" }] }],
      packageManager: [{ name: "nuget", evidence: [{ source: "App.csproj", value: "nuget" }] }],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const plan = planWorkflow(dotnetState);
    expect(plan.matchedRules).toContain("dotnet-ci");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);
    expect(ir.jobs.some(j => j.id === "test-dotnet")).toBe(true);

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("setup-dotnet@v4");
    expect(yaml).toContain("dotnet test");
  });

  it("plans, resolves, and compiles Ruby & Rails projects", () => {
    const rubyState: ProjectState = {
      runtime: [{ name: "ruby", version: "3.2", evidence: [{ source: "Gemfile", value: "Ruby" }] }],
      packageManager: [{ name: "bundler", evidence: [{ source: "Gemfile", value: "bundler" }] }],
      frameworks: [{ name: "rails", evidence: [{ source: "bin/rails", value: "rails" }] }],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const plan = planWorkflow(rubyState);
    expect(plan.matchedRules).toContain("ruby-ci");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);
    expect(ir.jobs.some(j => j.id === "test-ruby")).toBe(true);

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("setup-ruby@v1");
    expect(yaml).toContain("bundler-cache: true");
  });

  it("plans, resolves, and compiles PHP, Dart, Elixir, C++, Deno, and Swift projects", () => {
    const polyglotState: ProjectState = {
      runtime: [
        { name: "php", evidence: [{ source: "composer.json", value: "PHP" }] },
        { name: "dart", evidence: [{ source: "pubspec.yaml", value: "Dart" }] },
        { name: "elixir", evidence: [{ source: "mix.exs", value: "Elixir" }] },
        { name: "cpp", evidence: [{ source: "CMakeLists.txt", value: "C++" }] },
        { name: "deno", evidence: [{ source: "deno.json", value: "Deno" }] },
        { name: "swift", evidence: [{ source: "Package.swift", value: "Swift" }] }
      ],
      packageManager: [
        { name: "composer", evidence: [{ source: "composer.json", value: "composer" }] },
        { name: "pub", evidence: [{ source: "pubspec.yaml", value: "pub" }] },
        { name: "mix", evidence: [{ source: "mix.exs", value: "mix" }] }
      ],
      frameworks: [],
      testing: [],
      tooling: [],
      infrastructure: []
    };

    const plan = planWorkflow(polyglotState);
    expect(plan.matchedRules).toContain("php-ci");
    expect(plan.matchedRules).toContain("dart-ci");
    expect(plan.matchedRules).toContain("elixir-ci");
    expect(plan.matchedRules).toContain("cpp-ci");
    expect(plan.matchedRules).toContain("deno-ci");
    expect(plan.matchedRules).toContain("swift-ci");

    const resolved = resolvePlan(plan);
    const ir = buildWorkflowIR(plan, resolved);

    expect(ir.jobs.some(j => j.id === "test-php")).toBe(true);
    expect(ir.jobs.some(j => j.id === "test-dart")).toBe(true);
    expect(ir.jobs.some(j => j.id === "test-elixir")).toBe(true);
    expect(ir.jobs.some(j => j.id === "test-cpp")).toBe(true);
    expect(ir.jobs.some(j => j.id === "test-deno")).toBe(true);
    expect(ir.jobs.some(j => j.id === "test-swift")).toBe(true);

    const validation = validateWorkflowIR(ir);
    expect(validation.valid).toBe(true);

    const yaml = compileWorkflowYAML(ir);
    expect(yaml).toContain("setup-php@v2");
    expect(yaml).toContain("setup-dart@v1");
    expect(yaml).toContain("setup-beam@v1");
    expect(yaml).toContain("setup-deno@v2");
    expect(yaml).toContain("swift test");
    expect(yaml).toContain("cmake -B build");
  });
});

