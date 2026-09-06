import type { PlannedAction } from "@auto-gha/planner";
import type { ResolvedPrimitive } from "./types.js";
import {
  resolveRuntimeSetup,
  resolveGoBuild,
  resolveGoTest,
  resolvePythonTest,
  resolveRustBuild,
  resolveRustTest,
  resolveJavaBuild,
  resolveDotnetBuild,
  resolveDotnetTest,
  resolveRubyTest,
  resolvePhpTest,
  resolveDartTest,
  resolveElixirTest,
  resolveCppBuild,
  resolveCppTest,
  resolveDenoTest,
  resolveSwiftBuild,
  resolveSwiftTest
} from "./resolvers/runtime.js";
import { resolveDependencyInstall } from "./resolvers/dependencies.js";
import { resolveDockerBuild } from "./resolvers/docker.js";
import { resolveUnitTest, resolveE2ETest } from "./resolvers/testing.js";
import {
  resolveDeployAws,
  resolveDeployGcp,
  resolveDeployAzure,
  resolveDeployKubernetes,
  resolveDeployTerraform,
  resolveDeployGhcr
} from "./resolvers/deployment.js";

type ResolverFunction = (action: PlannedAction) => ResolvedPrimitive[];

export const resolverRegistry: Record<string, ResolverFunction> = {
  "runtime.setup": resolveRuntimeSetup,
  "dependency.install": resolveDependencyInstall,
  "docker.build": resolveDockerBuild,
  "test.unit": resolveUnitTest,
  "test.e2e": resolveE2ETest,
  "go.build": resolveGoBuild,
  "go.test": resolveGoTest,
  "python.test": resolvePythonTest,
  "rust.build": resolveRustBuild,
  "rust.test": resolveRustTest,
  "java.build": resolveJavaBuild,
  "java.test": resolveJavaBuild,
  "dotnet.build": resolveDotnetBuild,
  "dotnet.test": resolveDotnetTest,
  "ruby.test": resolveRubyTest,
  "php.test": resolvePhpTest,
  "dart.test": resolveDartTest,
  "elixir.test": resolveElixirTest,
  "cpp.build": resolveCppBuild,
  "cpp.test": resolveCppTest,
  "deno.test": resolveDenoTest,
  "swift.build": resolveSwiftBuild,
  "swift.test": resolveSwiftTest,

  // Deployment Resolvers
  "deploy.aws": resolveDeployAws,
  "deploy.gcp": resolveDeployGcp,
  "deploy.azure": resolveDeployAzure,
  "deploy.kubernetes": resolveDeployKubernetes,
  "deploy.terraform": resolveDeployTerraform,
  "deploy.ghcr": resolveDeployGhcr
};
