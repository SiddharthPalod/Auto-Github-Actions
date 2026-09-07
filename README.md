# Auto GitHub Actions (`auto-gha`)

> **Zero-Configuration GitHub Actions Workflow & Security Policy Compiler**

[![npm version](https://img.shields.io/npm/v/auto-gha.svg?color=blue)](https://www.npmjs.com/package/auto-gha)
[![npm downloads](https://img.shields.io/npm/dm/auto-gha.svg)](https://www.npmjs.com/package/auto-gha)
[![GitHub stars](https://img.shields.io/github/stars/SiddharthPalod/Auto-Github-Actions?style=social)](https://github.com/SiddharthPalod/Auto-Github-Actions)
[![license](https://img.shields.io/github/license/SiddharthPalod/Auto-Github-Actions)](https://github.com/SiddharthPalod/Auto-Github-Actions/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange?logo=pnpm)](https://pnpm.io/)

A deterministic policy compiler that inspects codebases, deduces capabilities, resolves official GitHub Actions patterns from a curated knowledge catalog, compiles type-safe, multi-job CI/CD workflows, and automatically orchestrates security policies, code scanning, and GitHub Pull Requests with zero manual configuration.

📦 **npm Package**: [https://www.npmjs.com/package/auto-gha](https://www.npmjs.com/package/auto-gha)  
🔗 **GitHub Repository**: [https://github.com/SiddharthPalod/Auto-Github-Actions](https://github.com/SiddharthPalod/Auto-Github-Actions)

---

## ⚡ Instant Usage

Run it directly in your project folder with `npx` (no install needed):

```bash
npx auto-gha
```

Scan any specific folder or remote public GitHub repository:

```bash
# Scan a local folder
npx auto-gha ./my-project

# Scan a remote GitHub repo
npx auto-gha https://github.com/expressjs/express
```

---

## 🛠️ Contributing & Local Development

We welcome contributions! This project is a monorepo managed by `pnpm`.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Setup

```bash
git clone https://github.com/SiddharthPalod/Auto-Github-Actions.git
cd Auto-Github-Actions
pnpm install
```

### Build & Test

To build all engine layers and the CLI:
```bash
pnpm -r build
```

To run the CLI locally in development mode:
```bash
pnpm --filter auto-gha dev .
```

To run the full test suite:
```bash
pnpm -r test
```

---

## 🏛️ Compiler Pipeline

```text
Repository / Remote Git URL
     │
     ▼
┌─────────────────────────┐
│  1. Repository Scanner  │  (File-system crawler + language & framework detectors)
└────────────┬────────────┘
             ▼
       Project State         (Raw facts & filesystem evidence)
             │
             ▼
┌─────────────────────────┐
│  2. Workflow Planner    │  (Policy rules engine: Facts ──► Capabilities)
└────────────┬────────────┘
             ▼
    Workflow Requirements    (Planned Actions across CI, CD, Security, Automation)
             │
             ▼
┌─────────────────────────┐
│ 3. Knowledge Resolver   │  (Starter Workflows catalog lookup + Provenance)
└────────────┬────────────┘
             ▼
    Resolved Primitives      (Uses / Run steps with provenance source tags)
             │
             ▼
┌─────────────────────────┐
│  4. Workflow Builder    │  (Partitions steps into parallel jobs & DAG dependencies)
└────────────┬────────────┘
             ▼
      Typed Workflow IR      (Compiler-independent AST)
             │
             ▼
┌─────────────────────────┐
│  5. Optimization Passes │  (Caching, Production Hardening, Job Timeouts, Concurrency)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  6. Security Compiler   │  (Dependabot, CodeQL, Code Scanning SAST, Native Audits, Trivy)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  7. Reconciliation & PR │  (AST Semantic Diffing + Non-Destructive Merge + 1-Click PR)
└────────────┬────────────┘
             ▼
.github/workflows/ci.yml
.github/workflows/codeql.yml
.github/workflows/code-scanning.yml
.github/workflows/security.yml
.github/dependabot.yml
```

---

## 📦 Monorepo Packages

| Package | Role | Description |
| :--- | :--- | :--- |
| **`@auto-gha/state`** | Data Contracts | Pure TypeScript interfaces representing discovered project facts, infrastructure markers, and evidence. |
| **`@auto-gha/scanner`** | Phase 1 Engine | High-performance filesystem crawler and deterministic detectors for Node, Python, Go, Rust, Docker, Java, AWS, GCP, Azure, K8s, Terraform, etc. |
| **`@auto-gha/planner`** | Phase 2 Engine | Capability vocabulary normalizer and declarative rule evaluation engine for CI and CD. |
| **`@auto-gha/resolver`** | Phase 3 Engine | Knowledge catalog containing normalized GitHub Starter Workflows with provenance tracking. |
| **`@auto-gha/workflow-ir`** | Phase 4 AST | Strongly-typed Workflow Intermediate Representation (Jobs, DAG `needs`, Environments, Conditions, Steps). |
| **`@auto-gha/compiler`** | Phase 4/5 Compiler | Workflow Builder, DAG Cycle Validator, and deterministic YAML emitter with optimization passes. |
| **`@auto-gha/security`** | Phase 6 Engine | Security Policy IR & Multi-artifact Security Compiler (Dependabot, CodeQL, Code Scanning, Trivy, Audits). |
| **`@auto-gha/reconciliation`** | Phase 7 Engine | Semantic AST diffing & non-destructive merging with existing `.github/workflows`. |
| **`@auto-gha/github`** | Phase 7 Automation | Native Git branch management and GitHub Pull Request automation. |
| **`auto-gha` (`apps/cli`)** | Developer CLI | Terminal runner with interactive live progress (Wizard v2), minimalist mode (v1), and `--inspect`. |

---

## 🚀 CLI Modes

### 1. Interactive CLI Wizard
Run the interactive wizard (defaults to Wizard v2 with live multi-phase visual feedback):
```bash
npx auto-gha
# or during development:
pnpm --filter auto-gha dev
```

### 2. Non-Interactive Inspection & Scripting
Print the AST, DAG structure, and compiled YAML to stdout:
```bash
npx auto-gha --inspect "../path-to-project"
npx auto-gha --inspect "https://github.com/expressjs/express"
```

---

## 💡 Core Invariants

1. **Deterministic Policy over AI Guessing:** Workflow requirements are generated through strict, provenance-backed rule evaluation.
2. **Compiler-Independent Workflow IR:** The intermediate representation (`WorkflowIR`) is a first-class, inspectable AST completely decoupled from YAML serialization.
3. **Failure Domain & Deployment Isolation:** Polyglot test jobs run in parallel, while CD jobs (`deploy-*`) are strictly guarded behind CI completion (`needs: [test-*]`).
4. **Monorepo & Polyglot Path Awareness:** Discovers nested package manifests (`package-lock.json`, `requirements.txt`, `Cargo.toml`, `go.mod`), injects recursive path caching (`cache-dependency-path`), and handles projects with or without root configurations.
5. **Non-Destructive Reconciliation:** When existing workflows contain custom deployment or notification steps, the AST diff engine preserves them during upgrades.
6. **Provenance Tracking:** Every resolved step preserves its origin (e.g. `source: actions/starter-workflows:ci/node.js.yml`).

---

## 🛠️ Supported CI/CD Ecosystems Catalog (`ci/`)

The engine automatically discovers project manifests across root and subdirectories and provisions official GitHub Actions templates:

| Ecosystem / Language | Starter Template | Detected Manifests & Files | Actions & Resolvers | Generated Job ID | Automatic Caching |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js / TypeScript** | `ci/node.js.yml` | `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` | `actions/setup-node@v4`, `pnpm/action-setup@v4` | `test-node` | `cache-dependency-path` (npm, pnpm, yarn) |
| **Python** | `ci/python-app.yml` | `requirements.txt`, `pyproject.toml`, `Pipfile` | `actions/setup-python@v5`, `pytest` | `test-python` | `pip` dependency caching |
| **Go** | `ci/go.yml` | `go.mod`, `go.sum` | `actions/setup-go@v5` | `test-go` | Go module caching |
| **Rust** | `ci/rust.yml` | `Cargo.toml`, `Cargo.lock` | Cargo build & test | `test-rust` | Cargo registry cache |
| **Java (Maven)** | `ci/maven.yml` | `pom.xml` | `actions/setup-java@v4` (`temurin`) | `test-java` | `~/.m2/repository` cache |
| **Java/Kotlin (Gradle)** | `ci/gradle.yml` | `build.gradle`, `build.gradle.kts`, `gradlew` | `actions/setup-java@v4` + `gradle/actions/setup-gradle@v4` | `test-java` | Native Gradle cache |
| **.NET / C# / F#** | `ci/dotnet.yml` | `*.csproj`, `*.fsproj`, `*.sln` | `actions/setup-dotnet@v4` | `test-dotnet` | NuGet package cache |
| **Ruby & Rails** | `ci/ruby.yml`, `ci/rubyonrails.yml` | `Gemfile`, `Gemfile.lock`, `*.gemspec` | `ruby/setup-ruby@v1` | `test-ruby` | Bundler cache (`bundler-cache: true`) |
| **PHP (Composer / Laravel)** | `ci/php.yml`, `ci/laravel.yml` | `composer.json`, `composer.lock`, `artisan` | `shivammathur/setup-php@v2` | `test-php` | Composer cache |
| **Dart & Flutter** | `ci/dart.yml` | `pubspec.yaml`, `pubspec.lock` | `dart-lang/setup-dart@v1` | `test-dart` | `~/.pub-cache` |
| **Elixir & Erlang** | `ci/elixir.yml` | `mix.exs`, `mix.lock` | `erlef/setup-beam@v1` | `test-elixir` | `_build` & `deps` cache |
| **C / C++ (CMake)** | `ci/cmake-single-platform.yml` | `CMakeLists.txt`, `Makefile` | CMake Build & CTest | `test-cpp` | Compiler cache |
| **Deno** | `ci/deno.yml` | `deno.json`, `deno.jsonc`, `deno.lock` | `denoland/setup-deno@v2` | `test-deno` | Deno cache |
| **Swift** | `ci/swift.yml` | `Package.swift` | Swift Package Manager | `test-swift` | SPM build cache |
| **Docker Containers** | `ci/docker-image.yml` | `Dockerfile`, `docker-compose.yml` | `docker/setup-buildx-action@v3` | `build-docker` | Buildx layer caching |

---

## 🛡️ Code Scanning & Security Scanners Matrix (`code-scanning/`)

The engine configures specialized static analysis (SAST), infrastructure security (IaC), and supply chain tools into `.github/workflows/code-scanning.yml`:

| Scanner Tool | Domain / Target | Detection Trigger | Official Action / Step | Minimum Policy Level | Output & Reporting |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **CodeQL Deep SAST** | Multi-Language SAST | JS/TS, Python, Go, Java, C#, Ruby, C++, Swift | `github/codeql-action/analyze@v3` | **Standard** | SARIF $\rightarrow$ GitHub Security Tab |
| **Semgrep SAST** | Universal SAST | Any codebase | `returntocorp/semgrep-action@v1` | **Strict** | `semgrep.sarif` $\rightarrow$ Security Tab |
| **Hadolint** | Dockerfile Lint & Security | `Dockerfile` detected | `hadolint/hadolint-action@v3.1.0` | **Standard** | `hadolint.sarif` $\rightarrow$ Security Tab |
| **tfsec** | Terraform IaC Security | `*.tf` files detected | `aquasecurity/tfsec-action@v1.0.3` | **Standard** | `tfsec.sarif` $\rightarrow$ Security Tab |
| **Bandit** | Python Security Linter | Python detected | `PyCQA/bandit` | **Standard** | Security annotations in Actions log |
| **Brakeman** | Ruby on Rails SAST | Ruby / Rails detected | `brakeman/brakeman-action@v1` | **Standard** | `brakeman.sarif` $\rightarrow$ Security Tab |
| **njsscan** | Node.js Security SAST | Node.js detected | `ajinabraham/njsscan-action@master` | **Standard** | `njsscan.sarif` $\rightarrow$ Security Tab |
| **Dependency Review** | PR Dependency Gating | Any repo on PR | `actions/dependency-review-action@v4` | **Standard** | PR comment + High/Critical blocker |
| **Google OSV-Scanner** | Open Source Vulnerabilities | Lockfiles detected | `google/osv-scanner-action@v1.9.0` | **Standard** | `osv-results.sarif` $\rightarrow$ Security Tab |
| **OpenSSF Scorecard** | Supply Chain Assurance | Public / Enterprise repo | `ossf/scorecard-action@v2.4.0` | **Strict** | `scorecard.sarif` $\rightarrow$ Security Tab |
| **Trivy Image Scan** | Container Vulnerabilities | `Dockerfile` detected | `aquasecurity/trivy-action@master` | **Standard** | Table summary / SARIF upload |
| **Native Audits** | Lockfile CVE Audits | npm, pip, cargo, go | `npm audit`, `pip-audit`, `cargo-audit`, `govulncheck` | **Minimal** | Console logs / Blocking in Strict |
| **Harden-Runner** | Network & Egress Security | All CI/CD jobs | `step-security/harden-runner@v2` | **Strict** | StepSecurity Insights Dashboard |
| **Gitleaks** | Secret & Key Leak Detection | Git history | `gitleaks/gitleaks-action@v2` | **Strict** | Blocks PR on secret detection |

---

## ☁️ Continuous Deployment & Cloud Targets Catalog (`deployments/`)

The engine configures downstream, environment-guarded Continuous Deployment (CD) jobs that execute only after all CI tests pass on `main`:

| Deployment Target | Starter Template | Detection Criteria | Key Official Actions | Generated CD Job ID | Environment & Guard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AWS ECS & ECR** | `deployments/aws.yml` | `task-definition.json`, `ecs-params.yml`, `.aws/` | `aws-actions/configure-aws-credentials@v4`, `aws-actions/amazon-ecs-deploy-task-definition@v2` | `deploy-aws` | `environment: production`<br>`if: branch == main` |
| **Google Cloud Run (GCP)** | `deployments/google-cloudrun-docker.yml` | `app.yaml`, `cloudbuild.yaml`, `cloudrun.yaml` | `google-github-actions/auth@v2`, `google-github-actions/deploy-cloudrun@v2` | `deploy-gcp` | `environment: production`<br>`if: branch == main` |
| **Azure Web App / Container** | `deployments/azure-container-webapp.yml` | `staticwebapp.config.json`, `azure-pipelines.yml` | `azure/login@v2`, `azure/webapps-deploy@v3` | `deploy-azure` | `environment: production`<br>`if: branch == main` |
| **Kubernetes (Helm / K8s)** | `deployments/azure-kubernetes-service-helm.yml` | `Chart.yaml`, `values.yaml`, `k8s/`, `manifests/` | `azure/setup-helm@v4.2.0`, `helm upgrade --install` | `deploy-k8s` | `environment: production`<br>`if: branch == main` |
| **Terraform Apply (IaC)** | `deployments/terraform.yml` | `*.tf`, `*.tfvars`, `terragrunt.hcl` | `hashicorp/setup-terraform@v3`, `terraform apply` | `deploy-terraform` | `environment: production`<br>`if: branch == main` |
| **GHCR Container Registry** | `deployments/docker-publish.yml` | `Dockerfile` detected with release policy | `docker/login-action@v3`, `docker/build-push-action@v6` | `deploy-ghcr` | `if: branch == main` |

---

## 📄 License

MIT © [Siddharth Palod](https://github.com/SiddharthPalod)