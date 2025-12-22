import { create } from "mutative";
import { type Config, ConfigSchema } from "shared";

import { ProjectScopedStore } from "./project-store";

class ConfigStore extends ProjectScopedStore<Config> {
  constructor() {
    super("config");
  }

  protected getDefaultData(): Config {
    return {
      enabled: false,
      testNoAuth: true,
      debug: false,
      mutations: [],
      userProfiles: [],
      queue: {
        maxConcurrentRequests: 5,
        requestsPerSecond: 30,
        requestTimeoutSeconds: 15,
      },
      ui: {
        showOnlyLengths: true,
        showFullURL: true,
        editorsLayout: "tabs",
        accessStateLabels: {
          authorized: "ALLOW",
          unauthorized: "DENY",
          uncertain: "UNCERTAIN",
        },
      },
      passiveFiltering: {
        httpql: "",
        onlyInScope: true,
        filters: [],
      },
      statusDetection: {
        authorizedHttpql: "",
        unauthorizedHttpql: "",
      },
    };
  }

  getConfig(): Config {
    return this.data;
  }

  updateConfig(newConfig: Partial<Config>): void {
    const result = ConfigSchema.partial().safeParse(newConfig);
    if (!result.success) {
      throw new Error("Invalid config passed into updateConfig.");
    }

    this.data = create(this.data, (draft) => {
      Object.assign(draft, newConfig);
    });
    this.notify();
    this.saveToFile();
  }
}

export const configStore = new ConfigStore();
