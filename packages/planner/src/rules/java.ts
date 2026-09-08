import type { Rule } from "../types.js";
import { findCapability, formatEvidence, noMatch } from "./helpers.js";

export const javaRule: Rule = {
  id: "java-ci",
  description: "Build and test Java applications using Maven or Gradle.",

  evaluate(_state, capabilities) {
    const javaCap = findCapability(capabilities, "runtime.java");
    if (!javaCap) return noMatch();

    const isMaven = findCapability(capabilities, "package.maven");
    const isGradle = findCapability(capabilities, "package.gradle");

    const actions: any[] = [
      {
        id: "java-setup",
        type: "runtime.setup",
        inputs: {
          runtime: "java",
          version: javaCap.version ?? "17"
        },
        reason: "Java JDK setup.",
        sourceRule: "java-ci"
      }
    ];

    if (isGradle) {
      actions.push({
        id: "gradle-build",
        type: "java.build",
        inputs: { tool: "gradle" },
        reason: "Build and test with Gradle.",
        sourceRule: "java-ci"
      });
    } else if (isMaven) {
      actions.push({
        id: "maven-build",
        type: "java.build",
        inputs: { tool: "maven" },
        reason: "Build and test with Maven.",
        sourceRule: "java-ci"
      });
    } else {
      actions.push({
        id: "javac-build",
        type: "java.build",
        inputs: { tool: "javac" },
        reason: "Compile standalone Java files with javac.",
        sourceRule: "java-ci"
      });
    }

    return {
      matched: true,
      actions,
      reasons: ["Java project detected.", ...formatEvidence(javaCap)]
    };
  }
};
