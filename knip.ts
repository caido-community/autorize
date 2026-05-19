import type { RawConfigurationOrFn } from "knip/dist/types/config.js";

const config: RawConfigurationOrFn = {
  workspaces: {
    ".": {
      entry: ["caido.config.ts", "eslint.config.ts"],
    },
    "packages/backend": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
      ignoreDependencies: ["caido", "shared"],
    },
    "packages/frontend": {
      entry: ["src/index.ts"],
      project: ["src/**/*.{ts,tsx,vue}"],
      ignoreDependencies: ["shared"],
    },
    "packages/shared": {
      entry: ["src/index.ts"],
      project: ["src/**/*.ts"],
    },
  },
};

export default config;
