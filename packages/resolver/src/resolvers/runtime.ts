import type { PlannedAction } from "@auto-gha/planner";
import type { ResolvedPrimitive } from "../types.js";
import { STARTER_WORKFLOWS_CATALOG } from "../catalog/starter-workflows.js";

export function resolveRuntimeSetup(action: PlannedAction): ResolvedPrimitive[] {
  const runtime = action.inputs?.runtime;
  const version = action.inputs?.version;

  if (typeof runtime !== "string") {
    throw new Error(`runtime.setup action "${action.id}" is missing runtime`);
  }

  const resolvedVersion = typeof version === "string" ? version : undefined;

  switch (runtime) {
    case "node": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/node.js.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-node");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "actions/setup-node@v4",
          with: resolvedVersion ? { "node-version": resolvedVersion } : (setupStep?.with ?? { "node-version": "20.x" }),
          reason: "Node.js runtime setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "python": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/python-app.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-python");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "actions/setup-python@v5",
          with: resolvedVersion ? { "python-version": resolvedVersion } : (setupStep?.with ?? { "python-version": "3.x" }),
          reason: "Python runtime setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "go": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/go.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-go");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "actions/setup-go@v5",
          with: resolvedVersion ? { "go-version": resolvedVersion } : (setupStep?.with ?? { "go-version": "1.22" }),
          reason: "Go runtime setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "java": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/maven.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-java");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "actions/setup-java@v4",
          with: {
            "java-version": resolvedVersion ?? "17",
            distribution: "temurin"
          },
          reason: "Java JDK runtime setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "dotnet": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/dotnet.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-dotnet");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "actions/setup-dotnet@v4",
          with: {
            "dotnet-version": resolvedVersion ?? "8.0.x"
          },
          reason: ".NET SDK setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "ruby": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/ruby.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-ruby");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "ruby/setup-ruby@v1",
          with: {
            "ruby-version": resolvedVersion ?? "3.2",
            "bundler-cache": true
          },
          reason: "Ruby setup with Bundler cache from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "php": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/php.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-php");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "shivammathur/setup-php@v2",
          with: {
            "php-version": resolvedVersion ?? "8.2"
          },
          reason: "PHP runtime setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "dart": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/dart.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-dart");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "dart-lang/setup-dart@v1",
          reason: "Dart SDK setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "elixir": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/elixir.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-beam");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "erlef/setup-beam@v1",
          with: {
            "elixir-version": resolvedVersion ?? "1.15",
            "otp-version": "26.0"
          },
          reason: "Erlang/Elixir BEAM setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    case "deno": {
      const template = STARTER_WORKFLOWS_CATALOG["ci/deno.yml"];
      const setupStep = template.steps.find(s => s.id === "setup-deno");
      return [
        {
          kind: "uses",
          uses: setupStep?.uses ?? "denoland/setup-deno@v2",
          with: {
            "deno-version": resolvedVersion ?? "v1.x"
          },
          reason: "Deno setup from starter workflow.",
          source: `actions/starter-workflows:${template.id}`,
          actionId: action.id
        }
      ];
    }

    default:
      throw new Error(`Unsupported runtime: ${runtime}`);
  }
}

export function resolveGoBuild(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/go.yml"];
  const setupStep = template.steps.find(s => s.id === "setup-go");

  return [
    {
      kind: "uses",
      uses: setupStep?.uses ?? "actions/setup-go@v5",
      with: action.inputs?.version && action.inputs.version !== "default"
        ? { "go-version": String(action.inputs.version) }
        : (setupStep?.with ?? { "go-version": "1.22" }),
      reason: "Setup Go environment for build.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    },
    {
      kind: "run",
      run: "if [ -f go.mod ]; then go build -v ./...; else for mod in $(find . -name 'go.mod' -not -path '*/.*'); do (cd \"$(dirname \"$mod\")\" && echo \"Building $(dirname \"$mod\")...\" && go build -v ./...); done; fi",
      reason: "Compile Go packages according to starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveGoTest(action: PlannedAction): ResolvedPrimitive[] {
  return [
    {
      kind: "run",
      run: "if [ -f go.mod ]; then go test -v ./...; else for mod in $(find . -name 'go.mod' -not -path '*/.*'); do (cd \"$(dirname \"$mod\")\" && echo \"Testing $(dirname \"$mod\")...\" && go test -v ./...); done; fi",
      reason: "Run Go test suite according to starter workflow.",
      source: "actions/starter-workflows:ci/go.yml",
      actionId: action.id
    }
  ];
}

export function resolvePythonTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/python-app.yml"];
  const setupStep = template.steps.find(s => s.id === "setup-python");

  return [
    {
      kind: "uses",
      uses: setupStep?.uses ?? "actions/setup-python@v5",
      with: { "python-version": "3.x" },
      reason: "Setup Python environment for test.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    },
    {
      kind: "run",
      run: "python -m pip install --upgrade pip pytest && if [ -f requirements.txt ]; then pip install -r requirements.txt; fi && for req in $(find . -name 'requirements.txt' -not -path '*/.*' -not -path './requirements.txt'); do pip install -r \"$req\"; done",
      reason: "Install Python dependencies and pytest test runner.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    },
    {
      kind: "run",
      run: "pytest || [ $? -eq 5 ]",
      reason: "Run Python tests with pytest according to starter workflow (pass if no tests collected).",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveRustBuild(action: PlannedAction): ResolvedPrimitive[] {
  return [
    {
      kind: "run",
      run: "if [ -f Cargo.toml ]; then cargo build --verbose; else for toml in $(find . -name 'Cargo.toml' -not -path '*/.*' -not -path '*/target/*'); do (cd \"$(dirname \"$toml\")\" && echo \"Building $(dirname \"$toml\")...\" && cargo build --verbose); done; fi",
      reason: "Compile Rust crates according to starter workflow.",
      source: "actions/starter-workflows:ci/rust.yml",
      actionId: action.id
    }
  ];
}

export function resolveRustTest(action: PlannedAction): ResolvedPrimitive[] {
  return [
    {
      kind: "run",
      run: "if [ -f Cargo.toml ]; then cargo test --verbose; else for toml in $(find . -name 'Cargo.toml' -not -path '*/.*' -not -path '*/target/*'); do (cd \"$(dirname \"$toml\")\" && echo \"Testing $(dirname \"$toml\")...\" && cargo test --verbose); done; fi",
      reason: "Run Rust tests according to starter workflow.",
      source: "actions/starter-workflows:ci/rust.yml",
      actionId: action.id
    }
  ];
}

export function resolveJavaBuild(action: PlannedAction): ResolvedPrimitive[] {
  const isGradle = action.inputs?.tool === "gradle";
  const templateId = isGradle ? "ci/gradle.yml" : "ci/maven.yml";
  const template = STARTER_WORKFLOWS_CATALOG[templateId];

  if (isGradle) {
    return [
      {
        kind: "uses",
        uses: "gradle/actions/setup-gradle@v4",
        reason: "Setup Gradle build tool from starter workflow.",
        source: `actions/starter-workflows:${template.id}`,
        actionId: action.id
      },
      {
        kind: "run",
        run: "./gradlew build",
        reason: "Execute Gradle build and tests.",
        source: `actions/starter-workflows:${template.id}`,
        actionId: action.id
      }
    ];
  }

  return [
    {
      kind: "run",
      run: "mvn -B package --file pom.xml",
      reason: "Execute Maven build and tests.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveDotnetBuild(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/dotnet.yml"];
  return [
    {
      kind: "run",
      run: "dotnet restore && dotnet build --no-restore",
      reason: "Restore and build .NET solution from starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveDotnetTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/dotnet.yml"];
  return [
    {
      kind: "run",
      run: "dotnet test --no-build --verbosity normal",
      reason: "Run .NET unit tests from starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveRubyTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/ruby.yml"];
  return [
    {
      kind: "run",
      run: "bundle exec rake || bundle exec rspec",
      reason: "Run Ruby test suite from starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolvePhpTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/php.yml"];
  return [
    {
      kind: "run",
      run: "composer install -q --no-ansi --no-interaction --no-scripts --no-progress --prefer-dist && (vendor/bin/phpunit || [ $? -eq 0 ])",
      reason: "Install Composer packages and run PHPUnit tests.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveDartTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/dart.yml"];
  return [
    {
      kind: "run",
      run: "dart pub get && dart test",
      reason: "Install dependencies and execute Dart tests.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveElixirTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/elixir.yml"];
  return [
    {
      kind: "run",
      run: "mix deps.get && mix test",
      reason: "Install Mix dependencies and execute tests.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveCppBuild(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/cmake-single-platform.yml"];
  return [
    {
      kind: "run",
      run: "cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --config Release",
      reason: "Configure and compile C/C++ CMake project.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveCppTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/cmake-single-platform.yml"];
  return [
    {
      kind: "run",
      run: "ctest --test-dir build --output-on-failure -C Release",
      reason: "Execute CTest test suite.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveDenoTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/deno.yml"];
  return [
    {
      kind: "run",
      run: "deno test",
      reason: "Run Deno tests.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveSwiftBuild(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/swift.yml"];
  return [
    {
      kind: "run",
      run: "swift build -v",
      reason: "Compile Swift packages from starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}

export function resolveSwiftTest(action: PlannedAction): ResolvedPrimitive[] {
  const template = STARTER_WORKFLOWS_CATALOG["ci/swift.yml"];
  return [
    {
      kind: "run",
      run: "swift test -v",
      reason: "Execute Swift unit tests from starter workflow.",
      source: `actions/starter-workflows:${template.id}`,
      actionId: action.id
    }
  ];
}
