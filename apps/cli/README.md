# auto-gha

> **Zero-Configuration GitHub Actions Workflow & Security Generator**

[![npm version](https://img.shields.io/npm/v/auto-gha.svg?color=blue)](https://www.npmjs.com/package/auto-gha)
[![npm downloads](https://img.shields.io/npm/dm/auto-gha.svg)](https://www.npmjs.com/package/auto-gha)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Auto--Github--Actions-blue?logo=github)](https://github.com/SiddharthPalod/Auto-Github-Actions)
[![license](https://img.shields.io/github/license/SiddharthPalod/Auto-Github-Actions)](https://github.com/SiddharthPalod/Auto-Github-Actions/blob/main/LICENSE)
[![node version](https://img.shields.io/node/v/auto-gha)](https://nodejs.org/)

Generate production-grade, hardened CI/CD pipelines, Dependabot rules, and SAST security workflows for any codebase in seconds — with zero configuration.

🔗 **GitHub Repository**: [https://github.com/SiddharthPalod/Auto-Github-Actions](https://github.com/SiddharthPalod/Auto-Github-Actions)  
📦 **npm Package**: [https://www.npmjs.com/package/auto-gha](https://www.npmjs.com/package/auto-gha)

---

## ⚡ Quick Start

Run it directly on your current directory with `npx` (no installation required):

```bash
npx auto-gha
```

Or scan any local folder or remote public GitHub repository:

```bash
# Scan a local folder
npx auto-gha ./my-app

# Scan a remote GitHub repository
npx auto-gha https://github.com/expressjs/express
```

---

## 🌟 Key Features

- 🔍 **Universal Tech Detection**: Automatically identifies runtimes (Node, Python, Go, Rust, Java, C++, Ruby, PHP, .NET, Swift, Elixir), package managers (npm, pnpm, yarn, bun, pip, cargo, etc.), frameworks, and Docker infrastructure.
- ⚡ **Optimized CI/CD Pipelines**: Builds parallel execution graphs (DAGs) with native dependency caching, 15-minute job timeouts, and concurrency cancellations.
- 🛡️ **Multi-Tier Security Policies**:
  - **CodeQL SAST**: Automated static application security testing for supported languages.
  - **Dependabot**: Automatic version and security update configs with PR grouping (`.github/dependabot.yml`).
  - **Vulnerability Scans**: Native lockfile audits (`npm audit`, `cargo audit`, `pip-audit`, `govulncheck`), Trivy filesystem/manifest scanning, and Hadolint.
- 🌿 **Git Integration**: Creates a local Git branch (`auto-gha/setup-ci-...`), commits the changes, and generates a 1-click Pull Request link.
- 🔄 **Safe Workflow Reconciliation**: Merges with existing `.github/workflows/ci.yml` non-destructively, preserving your custom user steps.

---

## 📖 CLI Options

| Command | Description |
| :--- | :--- |
| `npx auto-gha` | Interactive wizard with live compiler animation and project review (Default). |
| `npx auto-gha <path\|url>` | Scan a specific local directory path or remote Git repository URL. |
| `npx auto-gha --inspect <path>` | Non-interactive inspect mode; prints detected state, Workflow IR, and generated YAML to stdout. |
| `npx auto-gha --v1` | Fast minimalist wizard mode. |
| `npx auto-gha --help` | Display CLI help menu and usage guidelines. |

---

## 🛠 Local Development & Monorepo

`auto-gha` is part of the **Auto-Github-Actions** monorepo.

```bash
# Clone the repository
git clone https://github.com/SiddharthPalod/Auto-Github-Actions.git
cd Auto-Github-Actions

# Install dependencies and build all packages
pnpm install
pnpm -r build

# Run local CLI
pnpm --filter auto-gha dev .

# Run test suite
pnpm -r test
```

---

## 📄 License

MIT © [Siddharth Palod](https://github.com/SiddharthPalod)