import { readFile, writeFile } from "fs/promises";
import path from "path";

import { create } from "mutative";
import { type JobResult, type Template } from "shared";

import { requireSDK } from "../sdk";

class TemplatesStore {
  private templates: Template[] = [];
  private subscribers = new Set<(templates: Template[]) => void>();
  private saveTimeout: Timeout | undefined;

  async initialize(): Promise<void> {
    await this.loadFromFile();
  }

  private getFilePath(): string {
    const sdk = requireSDK();
    return path.join(sdk.meta.path(), "templates.json");
  }

  private async saveToFile(): Promise<void> {
    const filePath = this.getFilePath();
    await writeFile(filePath, JSON.stringify(this.templates, null, 2));
  }

  private debouncedSave(): void {
    if (this.saveTimeout !== undefined) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile();
    }, 5000);
  }

  private async loadFromFile(): Promise<void> {
    const filePath = this.getFilePath();
    try {
      const data = await readFile(filePath, "utf-8");
      this.templates = JSON.parse(data);
      this.notify();
    } catch {
      await this.saveToFile();
    }
  }

  getTemplates(): Template[] {
    return this.templates;
  }

  addTemplate(template: Template): void {
    const sdk = requireSDK();

    this.templates = create(this.templates, (draft) => {
      draft.push(template);
    });

    this.notify();
    this.debouncedSave();
    sdk.api.send("template:created", template);
  }

  deleteTemplate(templateId: number): void {
    const sdk = requireSDK();

    this.templates = create(this.templates, (draft) => {
      return draft.filter((t) => t.id !== templateId);
    });

    this.notify();
    this.debouncedSave();
    sdk.api.send("template:deleted", templateId);
  }

  addTemplateResult(templateId: number, result: JobResult): void {
    const sdk = requireSDK();

    this.templates = create(this.templates, (draft) => {
      const template = draft.find((t) => t.id === templateId);
      if (template) {
        if (result.kind === "Ok") {
          const existingIndex = template.results.findIndex(
            (r) => r.kind === "Ok" && r.type === result.type,
          );
          if (existingIndex >= 0) {
            template.results[existingIndex] = result;
          } else {
            template.results.push(result);
          }
        } else {
          template.results.push(result);
        }
        sdk.api.send("template:updated", templateId, template);
      }
    });

    this.notify();
    this.debouncedSave();
  }

  clearTemplateResults(templateId: number): void {
    const sdk = requireSDK();

    this.templates = create(this.templates, (draft) => {
      const template = draft.find((t) => t.id === templateId);
      if (template) {
        template.results = [];
        sdk.api.send("template:updated", templateId, template);
      }
    });

    this.notify();
    this.debouncedSave();
  }

  subscribe(subscriber: (templates: Template[]) => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  private notify(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.templates);
    }
  }
}

export const templatesStore = new TemplatesStore();
