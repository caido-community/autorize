import { create } from "mutative";
import { type JobResult, type Template } from "shared";

import { requireSDK } from "../sdk";

import { ProjectScopedStore } from "./project-store";

class TemplatesStore extends ProjectScopedStore<Template[]> {
  private saveTimeout: Timeout | undefined;

  constructor() {
    super("templates");
  }

  protected getDefaultData(): Template[] {
    return [];
  }

  private debouncedSave(): void {
    if (this.saveTimeout !== undefined) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile();
    }, 1000);
  }

  getTemplates(): Template[] {
    return this.data;
  }

  addTemplate(template: Template): void {
    const sdk = requireSDK();

    this.data = create(this.data, (draft) => {
      draft.push(template);
    });

    this.notify();
    this.debouncedSave();
    sdk.api.send("template:created", template);
  }

  deleteTemplate(templateId: number): void {
    const sdk = requireSDK();

    this.data = create(this.data, (draft) => {
      return draft.filter((t) => t.id !== templateId);
    });

    this.notify();
    this.debouncedSave();
    sdk.api.send("template:deleted", templateId);
  }

  addTemplateResult(templateId: number, result: JobResult): void {
    const sdk = requireSDK();

    this.data = create(this.data, (draft) => {
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

    this.data = create(this.data, (draft) => {
      const template = draft.find((t) => t.id === templateId);
      if (template) {
        template.results = [];
        sdk.api.send("template:updated", templateId, template);
      }
    });

    this.notify();
    this.debouncedSave();
  }
}

export const templatesStore = new TemplatesStore();
