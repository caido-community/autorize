import { readFile, writeFile } from "fs/promises";
import path from "path";

import { create } from "mutative";
import { type Config, ConfigSchema } from "shared";

import { requireSDK } from "../sdk";

class ConfigStore {
  private config: Config = {
    enabled: false,
    testNoAuth: true,
    debug: false,
    mutations: [
      {
        type: "mutated",
        kind: "HeaderAdd",
        header: "test",
        value: "test",
      },
    ],
    queue: {
      maxConcurrentRequests: 3,
      requestsPerSecond: 10,
      requestTimeoutSeconds: 30,
    },
    ui: {
      showOnlyLengths: true,
      showFullURL: true,
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

  private subscribers = new Set<(config: Config) => void>();

  async initialize(): Promise<void> {
    await this.loadFromFile();
  }

  private getFilePath(): string {
    const sdk = requireSDK();
    return path.join(sdk.meta.path(), "config.json");
  }

  private async saveToFile(): Promise<void> {
    const filePath = this.getFilePath();
    await writeFile(filePath, JSON.stringify(this.config, null, 2));
  }

  private async loadFromFile(): Promise<void> {
    const filePath = this.getFilePath();
    try {
      const data = await readFile(filePath, "utf-8");
      const loaded = JSON.parse(data);
      Object.assign(this.config, loaded);
      this.notify();
    } catch {
      await this.saveToFile();
    }
  }

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
    this.saveToFile();
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
