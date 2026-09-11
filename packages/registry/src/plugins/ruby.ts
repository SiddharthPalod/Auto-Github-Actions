import type { AutoGhaPlugin, ResolverContext, StepIR } from "../types.js";

export const rubyPlugin: AutoGhaPlugin = {
  id: "ruby",
  name: "Ruby",
  type: "language",
  detection: {
    manifests: ["Gemfile", "Gemfile.lock", "*.gemspec", "**/Gemfile"],
    extensions: [".rb"],
    async predicate(context, state) {
      const gemfiles = context.findFiles(f => f.endsWith("Gemfile") || f.endsWith(".gemspec"));
      if (gemfiles.length > 0) {
        state.runtime.push({
          name: "ruby",
          version: "3.2",
          evidence: gemfiles.map(file => ({ source: file, value: "Gemfile detected" }))
        });
        state.packageManager.push({
          name: "bundler",
          evidence: gemfiles.map(file => ({ source: file, value: "Bundler detected" }))
        });
      } else {
        const rbFiles = context.findFiles(f => f.endsWith(".rb"));
        if (rbFiles.length > 0) {
          state.runtime.push({
            name: "ruby",
            version: "3.2",
            evidence: rbFiles.slice(0, 5).map(file => ({ source: file, value: "Ruby source file (.rb)" }))
          });
        }
      }
    }
  },
  provides: ["setup", "test"],
  resolvers: {
    setup(ctx: ResolverContext): StepIR[] {
      const rubyRuntime = ctx.state.runtime.find(r => r.name === "ruby");
      return [
        {
          kind: "uses",
          uses: "ruby/setup-ruby@v1",
          with: {
            "ruby-version": rubyRuntime?.version ?? "3.2",
            "bundler-cache": true
          },
          source: "actions/starter-workflows:ci/ruby.yml"
        }
      ];
    },
    test(_ctx: ResolverContext): StepIR[] {
      return [
        {
          kind: "run",
          run: "bundle exec rake || bundle exec rspec",
          source: "actions/starter-workflows:ci/ruby.yml"
        }
      ];
    }
  },
  jobMeta: {
    id: "test-ruby",
    name: "Ruby CI",
    category: "test"
  }
};
