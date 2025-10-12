import { type RequestResponse, type RequestSpecRaw } from "caido:utils";
import PQueue from "p-queue";
import { type APIResult } from "shared";
import { HttpForge } from "ts-http-forge";

import { requireSDK } from "../sdk";
import { configStore } from "../stores/config";
import { Uint8ArrayToString } from "../utils";

class RequestGate {
  private queue = new PQueue({
    concurrency: 2,
    intervalCap: 1,
    interval: 1000,
    carryoverConcurrencyCount: true,
  });

  constructor() {
    this.updateFromConfig();
    configStore.subscribe(() => this.updateFromConfig());
  }

  updateFromConfig() {
    const config = configStore.getConfig();
    const { queue } = config;

    this.queue = new PQueue({
      concurrency: queue.maxConcurrentRequests,
      intervalCap: queue.requestsPerSecond,
      interval: 1000,
      carryoverConcurrencyCount: true,
    });
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    return this.queue.add(task);
  }

  wrapSend(request: RequestSpecRaw): Promise<APIResult<RequestResponse>> {
    const headersToRemove = ["If-None-Match", "If-Modified-Since"];
    const raw = Uint8ArrayToString(request.getRaw());

    let forge = HttpForge.create(raw);

    for (const header of headersToRemove) {
      forge = forge.removeHeader(header);
    }

    const modifiedRaw = forge.build();
    request.setRaw(modifiedRaw);

    return this.add(() => sendRequest(request));
  }

  clear() {
    this.queue.clear();
  }
}

async function sendRequest(
  _requestSpecRaw: RequestSpecRaw,
): Promise<APIResult<RequestResponse>> {
  try {
    const sdk = requireSDK();
    const result = await sdk.requests.send(_requestSpecRaw);
    return {
      kind: "Ok",
      value: result,
    };
  } catch (error) {
    return {
      kind: "Error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const requestGate = new RequestGate();
