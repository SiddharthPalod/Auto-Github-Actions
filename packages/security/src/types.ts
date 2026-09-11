export type SecurityLevel = "minimal" | "standard" | "strict" | "none";

export type DependabotEcosystem =
  | "npm"
  | "cargo"
  | "pip"
  | "gomod"
  | "docker"
  | "github-actions"
  | "maven"
  | "gradle"
  | "nuget"
  | "bundler"
  | "composer"
  | "pub"
  | "mix";

export type DependabotTarget = {
  packageEcosystem: DependabotEcosystem;
  directory: string;
  interval: "daily" | "weekly" | "monthly";
};

export type NativeAuditConfig = {
  tool: "cargo-audit" | "npm-audit" | "pip-audit" | "govulncheck";
  command: string;
  failOnError: boolean;
};

export type CodeQLLanguage =
  | "javascript-typescript"
  | "python"
  | "go"
  | "c-cpp"
  | "ruby"
  | "java-kotlin"
  | "csharp"
  | "swift";

export type CodeScanningScanner =
  | "semgrep"
  | "hadolint"
  | "tfsec"
  | "kubesec"
  | "bandit"
  | "brakeman"
  | "sobelow"
  | "clippy"
  | "njsscan"
  | "flawfinder"
  | "scorecard"
  | "dependency-review"
  | "osv-scanner"
  | "syft"
  | "anchore"
  | "checkmarx"
  | "veracode"
  | "stackhawk"
  | "sysdig"
  | "synopsys"
  | "zscaler-iac"
  | "xanitizer";


export type CodeScanningTargetConfig = {
  tool: CodeScanningScanner;
  targetPath?: string;
  failOnError: boolean;
  uploadSarif: boolean;
};

export type SecurityPolicyIR = {
  level: SecurityLevel;
  dependabot: {
    enabled: boolean;
    ecosystems: DependabotTarget[];
  };
  nativeAudits: NativeAuditConfig[];
  codeql: {
    enabled: boolean;
    languages: CodeQLLanguage[];
    scheduleCron?: string;
  };
  codeScanning: {
    enabled: boolean;
    scanners: CodeScanningTargetConfig[];
  };
  containerScanning: {
    enabled: boolean;
    dockerfiles: string[];
    severityThreshold: "CRITICAL" | "HIGH,CRITICAL" | "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL";
    uploadSarif: boolean;
  };
  secretScanning: {
    enabled: boolean;
    tool: "gitleaks" | "harden-runner";
  };
  enforcement: {
    blockOnVulnerabilities: boolean;
  };
};

export type GeneratedSecurityArtifacts = {
  policy: SecurityPolicyIR;
  dependabotYaml?: string;
  codeqlYaml?: string;
  securityWorkflowYaml?: string;
  codeScanningYaml?: string;
};
