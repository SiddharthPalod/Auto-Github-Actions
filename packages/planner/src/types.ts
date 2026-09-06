import type { ProjectState } from "@auto-gha/state";

export type CapabilityId =
  | "runtime.node"
  | "runtime.python"
  | "runtime.go"
  | "runtime.rust"
  | "runtime.java"
  | "runtime.dotnet"
  | "runtime.ruby"
  | "runtime.php"
  | "runtime.dart"
  | "runtime.elixir"
  | "runtime.cpp"
  | "runtime.deno"
  | "runtime.swift"

  | "package.npm"
  | "package.pnpm"
  | "package.yarn"
  | "package.bun"
  | "package.cargo"
  | "package.maven"
  | "package.gradle"
  | "package.nuget"
  | "package.bundler"
  | "package.composer"
  | "package.pub"
  | "package.mix"

  | "framework.react"
  | "framework.next"
  | "framework.express"
  | "framework.nestjs"
  | "framework.rails"
  | "framework.laravel"
  | "framework.symfony"

  | "test.jest"
  | "test.vitest"
  | "test.playwright"
  | "test.cypress"

  | "tool.typescript"
  | "tool.eslint"
  | "tool.prettier"

  | "infra.docker"
  | "infra.docker-compose"
  | "infra.aws"
  | "infra.gcp"
  | "infra.azure"
  | "infra.kubernetes"
  | "infra.terraform"
  | "infra.ghcr";

export type ResolvedCapability = {
  id: CapabilityId;
  confidence: number;
  version?: string;
  evidence: {
    source: string;
    reason: string;
  }[];
};

export type ActionType =
  | "runtime.setup"
  | "dependency.install"
  | "code.lint"
  | "code.typecheck"
  | "test.unit"
  | "test.e2e"
  | "go.build"
  | "go.test"
  | "python.test"
  | "rust.build"
  | "rust.test"
  | "java.build"
  | "java.test"
  | "dotnet.build"
  | "dotnet.test"
  | "ruby.test"
  | "php.test"
  | "dart.test"
  | "elixir.test"
  | "cpp.build"
  | "cpp.test"
  | "deno.test"
  | "swift.build"
  | "swift.test"
  | "docker.build"
  | "deploy.aws"
  | "deploy.gcp"
  | "deploy.azure"
  | "deploy.kubernetes"
  | "deploy.terraform"
  | "deploy.ghcr";

export type PlannedAction = {
  id: string;
  type: ActionType;
  inputs?: Record<string, string | number | boolean>;
  reason: string;
  sourceRule: string;
};

export type RuleResult = {
  matched: boolean;
  actions: PlannedAction[];
  reasons: string[];
};

export type Rule = {
  id: string;
  description: string;
  evaluate(
    state: ProjectState,
    capabilities: ResolvedCapability[]
  ): RuleResult;
};

export type WorkflowPlan = {
  capabilities: ResolvedCapability[];
  actions: PlannedAction[];
  matchedRules: string[];
  diagnostics: string[];
};
