import { type Request, type Response } from "caido:utils";
import PQueue from "p-queue";
import { type Job, type Template } from "shared";

import { configStore } from "../stores/config";
import { templatesStore } from "../stores/templates";
import { debugLog, generateId } from "../utils";

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

    debugLog(
      `addRequest called for ${request.getMethod()} ${request.getUrl()}, force=${options.force}`,
    );

    if (!options.force && !config.enabled) {
      debugLog("addRequest rejected: queue is paused");
      return { kind: "Error", reason: "Queue is paused" };
    }

    const anyMutatedMutations = config.mutations.some(
      (m) => m.type === "mutated",
    );
    if (!anyMutatedMutations) {
      debugLog("addRequest rejected: no mutated mutations configured");
      return {
        kind: "Error",
        reason: "Please configure authorization for the second user first",
      };
    }

    const templateKey = `${request.getMethod()}:${request.getHost()}:${request.getPort()}${request.getPath()}${request.getQuery()}`;
    const existingTemplate = templates.find((tmpl) => tmpl.key === templateKey);

    if (existingTemplate) {
      debugLog("addRequest rejected: template already exists");
      return { kind: "Error", reason: "Template already exists" };
    }

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

    debugLog(
      `Added job ${job.id} to queue for template ${template.id}, queue size: ${this.queue.size}, pending: ${this.queue.pending}`,
    );

    templatesStore.addTemplate(template);
    this.queue.add(() => this.worker(job));
    return { kind: "Ok", template };
  }

  rerunTemplate(templateId: number) {
    const templates = templatesStore.getTemplates();
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      debugLog(`rerunTemplate failed: template ${templateId} not found`);
      return;
    }

    const job: Job = {
      id: generateId(),
      templateId,
      baselineRequestId: template.request.id,
      status: "pending",
    };

    debugLog(
      `Rerunning template ${templateId}, new job ${job.id}, queue size: ${this.queue.size}, pending: ${this.queue.pending}`,
    );

    templatesStore.clearTemplateResults(templateId);
    this.queue.add(() => this.worker(job));
  }

  clear() {
    debugLog(
      `Clearing job queue, current size: ${this.queue.size}, pending: ${this.queue.pending}`,
    );
    this.queue.clear();
    debugLog(`Job queue cleared, new size: ${this.queue.size}`);
  }

  private async worker(job: Job) {
    debugLog(`Worker started for job ${job.id}, template ${job.templateId}`);

    const templates = templatesStore.getTemplates();
    const template = templates.find((t) => t.id === job.templateId);
    if (!template) {
      debugLog(
        `Worker skipping job ${job.id}: template ${job.templateId} no longer exists`,
      );
      return;
    }

    for await (const result of executeJob(job)) {
      debugLog(
        `Job ${job.id} result:`,
        result.kind === "Ok"
          ? `${result.type} request`
          : `Error: ${result.error}`,
      );
      templatesStore.addTemplateResult(job.templateId, result);
    }
    debugLog(`Worker finished for job ${job.id}`);
  }

  private getNextId() {
    const currentTemplates = templatesStore.getTemplates();
    return currentTemplates.length > 0
      ? Math.max(...currentTemplates.map((t) => t.id)) + 1
      : 1;
  }
}

export const jobsQueue = new JobsQueue();
