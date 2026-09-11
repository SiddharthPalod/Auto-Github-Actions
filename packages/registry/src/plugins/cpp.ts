import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const cppPlugin: AutoGhaPlugin = {
  id: "cpp",
  name: "C/C++",
  type: "language",
  detection: {
    manifests: ["CMakeLists.txt", "Makefile", "**/CMakeLists.txt"],
    extensions: [".cpp", ".c", ".cc", ".cxx", ".h", ".hpp"],
    async predicate(context, state) {
      const cmakeFiles = context.findFiles(f => f.endsWith("CMakeLists.txt") || f.endsWith("Makefile"));
      if (cmakeFiles.length > 0) {
        state.runtime.push({
          name: "cpp",
          evidence: cmakeFiles.map(file => ({ source: file, value: "C/C++ build system detected" }))
        });
      } else {
        const cppFiles = context.findFiles(
          f => f.endsWith(".cpp") || f.endsWith(".c") || f.endsWith(".cc") || f.endsWith(".cxx") || f.endsWith(".h") || f.endsWith(".hpp")
        );
        if (cppFiles.length > 0) {
          state.runtime.push({
            name: "cpp",
            evidence: cppFiles.slice(0, 5).map(file => ({ source: file, value: "C/C++ source file" }))
          });
        }
      }
    }
  },
  provides: ["build", "test"],
  resolvers: {
    build(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "if [ -f CMakeLists.txt ]; then cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --config Release; else for cmake_file in $(find . -maxdepth 4 -name 'CMakeLists.txt' -not -path '*/.*' -not -path '*/build/*'); do dir=\"$(dirname \"$cmake_file\")\"; (cd \"$dir\" && echo \"Building CMake project in $dir...\" && cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build --config Release); done; fi",
          source: "actions/starter-workflows:ci/cmake-single-platform.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "ctest --test-dir build --output-on-failure -C Release",
          source: "actions/starter-workflows:ci/cmake-single-platform.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-cpp",
    name: "C/C++ CI",
    category: "test"
  }
};
