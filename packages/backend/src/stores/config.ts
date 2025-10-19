import { create } from "mutative";
import { type Config, ConfigSchema } from "shared";

class ConfigStore {
  // Default config
  private config: Config = {
    enabled: false,
    testNoAuth: true,
    debug: false,
    mutations: [
      {
        kind: "HeaderAdd",
        header: "test",
        value: "te",
      },
    ],
    queue: {
      maxConcurrentRequests: 2,
      requestsPerSecond: 10,
    },
    ui: {
      showOnlyLengths: true,
    },
    passiveFiltering: {
      httpql: "",
      onlyInScope: true,
      filters: [],
    },
  };

  private subscribers = new Set<(config: Config) => void>();

  getConfig(): Config {
    return this.config;
  }

  updateConfig(newConfig: Partial<Config>): void {
    const result = ConfigSchema.partial().safeParse(newConfig);
    if (!result.success) {
      throw new Error("Invalid config passed into updateConfig.");
    }

    this.config = create(this.config, (draft) => {
      Object.assign(draft, newConfig);
    });
    this.notify();
  }

  subscribe(subscriber: (config: Config) => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  private notify(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.config);
    }
  }
}

export const configStore = new ConfigStore();
