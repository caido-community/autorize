import { type Request, type Response } from "caido:utils";
import fastq from "fastq";
import { type Job, type Template } from "shared";

import { executeJob } from "./executor";
import { requestGate } from "./requestGate";
import { store } from "./store";
import { generateId } from "./utils";

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
  private queue = fastq.promise(this, this.worker, 3);

  constructor() {
    const adjust = () => {
      const state = store.getState();
      const config = state.config.queue;

      this.queue.concurrency = Math.max(1, config.maxConcurrentRequests);
      requestGate.updateFromConfig();
    };

    adjust();
    store.subscribe(adjust);
  }

  addRequest(
    request: Request,
    response: Response,
    options: { force: boolean } = { force: false },
  ): AddRequestResult {
    const { config } = store.getState();

    if (!options.force && (!config.enabled || config.queue.paused))
      return { kind: "Error", reason: "Queue is paused" };

    if (config.mutations.length === 0)
      return {
        kind: "Error",
        reason: "Please configure authorization for the second user first",
      };

    const templateKey = `${request.getMethod()}:${request.getHost()}:${request.getPort()}${request.getPath()}${request.getQuery()}`;
    const existingTemplate = store
      .getState()
      .templates.find((t) => t.key === templateKey);

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
      response: {
        id: response.getId(),
        code: response.getCode(),
        length: response.getRaw().toText().length,
      },
      results: [],
    };

    const job: Job = {
      id: generateId(),
      templateId: template.id,
      baselineRequestId: request.getId(),
      status: "pending",
    };

    store.addTemplate(template);
    this.queue.push(job);
    return { kind: "Ok", template };
  }

  rerunTemplate(templateId: number) {
    const state = store.getState();
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) return;

    const job: Job = {
      id: generateId(),
      templateId,
      baselineRequestId: template.request.id,
      status: "pending",
    };

    store.clearTemplateResults(templateId);
    this.queue.push(job);
  }

  clear() {
    this.queue.kill();
    this.queue = fastq.promise(this, this.worker, this.queue.concurrency);
  }

  pause() {
    const queueConfig = store.getState().config.queue;
    store.updateConfig({
      queue: { ...queueConfig, paused: true },
    });
    this.queue.pause();
    requestGate.pause();
  }

  resume() {
    const queueConfig = store.getState().config.queue;
    store.updateConfig({
      queue: { ...queueConfig, paused: false },
    });
    this.queue.resume();
    requestGate.resume();
  }

  private async worker(job: Job) {
    for await (const result of executeJob(job)) {
      store.addTemplateResult(job.templateId, result);
    }
  }

  private getNextId() {
    const currentTemplates = store.getState().templates;
    return currentTemplates.length > 0
      ? Math.max(...currentTemplates.map((t) => t.id)) + 1
      : 1;
  }
}

export const jobsQueue = new JobsQueue();
