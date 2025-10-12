import { type Request, type Response } from "caido:utils";
import PQueue from "p-queue";
import { type Job, type Template } from "shared";

import { configStore } from "../stores/config";
import { templatesStore } from "../stores/templates";
import { generateId } from "../utils";

import { executeJob } from "./executor";

export type AddRequestResult =
  | {
      kind: "Ok";
      template: Template;
    }
  | {
      kind: "Error";
      reason: string;
    };

class JobsQueue {
  private queue = new PQueue({ concurrency: 3 });

  constructor() {
    const adjust = () => {
      const config = configStore.getConfig();
      this.queue.concurrency = Math.max(1, config.queue.maxConcurrentRequests);
    };

    adjust();
    configStore.subscribe(adjust);
  }

  addRequest(
    request: Request,
    response: Response,
    options: { force: boolean } = { force: false },
  ): AddRequestResult {
    const config = configStore.getConfig();
    const templates = templatesStore.getTemplates();

    if (!options.force && !config.enabled)
      return { kind: "Error", reason: "Queue is paused" };

    if (config.mutations.length === 0)
      return {
        kind: "Error",
        reason: "Please configure authorization for the second user first",
      };

    const templateKey = `${request.getMethod()}:${request.getHost()}:${request.getPort()}${request.getPath()}${request.getQuery()}`;
    const existingTemplate = templates.find((tmpl) => tmpl.key === templateKey);

    if (existingTemplate)
      return { kind: "Error", reason: "Template already exists" };

    const template = {
      id: this.getNextId(),
      key: templateKey,
      request: {
        id: request.getId(),
        method: request.getMethod(),
        url: request.getUrl(),
      },
      results: [
        {
          kind: "Ok" as const,
          type: "baseline" as const,
          request: {
            id: request.getId(),
            method: request.getMethod(),
            url: request.getUrl(),
          },
          response: {
            id: response.getId(),
            code: response.getCode(),
            length: response.getRaw().toText().length,
          },
        },
      ],
    };

    const job: Job = {
      id: generateId(),
      templateId: template.id,
      baselineRequestId: request.getId(),
      status: "pending",
    };

    templatesStore.addTemplate(template);
    this.queue.add(() => this.worker(job));
    return { kind: "Ok", template };
  }

  rerunTemplate(templateId: number) {
    const templates = templatesStore.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const job: Job = {
      id: generateId(),
      templateId,
      baselineRequestId: template.request.id,
      status: "pending",
    };

    templatesStore.clearTemplateResults(templateId);
    this.queue.add(() => this.worker(job));
  }

  clear() {
    this.queue.clear();
  }

  private async worker(job: Job) {
    for await (const result of executeJob(job)) {
      templatesStore.addTemplateResult(job.templateId, result);
    }
  }

  private getNextId() {
    const currentTemplates = templatesStore.getTemplates();
    return currentTemplates.length > 0
      ? Math.max(...currentTemplates.map((t) => t.id)) + 1
      : 1;
  }
}

export const jobsQueue = new JobsQueue();
