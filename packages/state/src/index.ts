export type RuntimeName =
  | "node"
  | "python"
  | "go"
  | "rust"
  | "java"
  | "dotnet"
  | "ruby"
  | "php"
  | "dart"
  | "elixir"
  | "cpp"
  | "deno"
  | "swift"
  | "scala"
  | "r";

export type PackageManagerName =
  | "npm"
  | "pnpm"
  | "yarn"
  | "bun"
  | "cargo"
  | "pip"
  | "poetry"
  | "gomod"
  | "maven"
  | "gradle"
  | "nuget"
  | "bundler"
  | "composer"
  | "pub"
  | "mix";

export type InfrastructureName =
  | "docker"
  | "kubernetes"
  | "terraform"
  | "aws"
  | "gcp"
  | "azure"
  | "ghcr"
  | "helm"
  | "ibm"
  | "openshift"
  | "tencent"
  | "octopusdeploy";


export type Evidence = {
  source: string;
  value: string;
};

export type Runtime = {
  name: RuntimeName;
  version?: string;
  evidence: Evidence[];
};

export type PackageManager = {
  name: PackageManagerName;
  evidence: Evidence[];
};

export type Capability = {
  name: string;
  evidence: Evidence[];
};

export type ProjectState = {
  runtime: Runtime[];
  packageManager: PackageManager[];
  frameworks: Capability[];
  testing: Capability[];
  tooling: Capability[];
  infrastructure: Capability[];
};