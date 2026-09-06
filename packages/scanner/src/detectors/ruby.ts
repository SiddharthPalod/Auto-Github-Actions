import type { Detector, RepositoryContext } from "../detector.js";
import type { ProjectState } from "@auto-gha/state";

export const rubyDetector: Detector = {
  name: "ruby",

  async detect(context: RepositoryContext, state: ProjectState): Promise<void> {
    const gemfiles = context.findFiles(f => f.endsWith("Gemfile") || f.endsWith(".gemspec"));
    if (gemfiles.length > 0) {
      state.runtime.push({
        name: "ruby",
        version: "3.2",
        evidence: gemfiles.map(file => ({ source: file, value: "Ruby project detected" }))
      });
      state.packageManager.push({
        name: "bundler",
        evidence: gemfiles.map(file => ({ source: file, value: "Bundler detected" }))
      });
    }

    if (context.findFiles(f => f.endsWith("config/application.rb") || f.endsWith("bin/rails")).length > 0) {
      state.frameworks.push({
        name: "rails",
        evidence: [{ source: "config/application.rb", value: "Ruby on Rails detected" }]
      });
    }
  }
};
