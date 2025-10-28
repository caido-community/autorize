import { type RequestResponse, type RequestSpecRaw } from "caido:utils";
import PQueue from "p-queue";
import { type APIResult } from "shared";
import { HttpForge } from "ts-http-forge";

import { requireSDK } from "../sdk";
import { configStore } from "../stores/config";
import { debugLog, Uint8ArrayToString } from "../utils";

class RequestGate {
  private queue: PQueue;

  constructor() {
    const config = configStore.getConfig();
    this.queue = new PQueue({
      concurrency: config.queue.maxConcurrentRequests,
      intervalCap: config.queue.requestsPerSecond,
      interval: 1000,
      carryoverConcurrencyCount: true,
    });

    configStore.subscribe(() => this.updateFromConfig());
  }

  updateFromConfig() {
    const config = configStore.getConfig();
    const { queue } = config;

    debugLog(
      `Updating request gate config: concurrency=${queue.maxConcurrentRequests}, rps=${queue.requestsPerSecond}`,
    );

    this.queue.concurrency = queue.maxConcurrentRequests;
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    debugLog(
      `Adding task to request gate, queue size: ${this.queue.size}, pending: ${this.queue.pending}`,
    );
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

    debugLog(`Queueing request to send via request gate`);
    return this.add(() => sendRequest(request));
  }
}

async function sendRequest(
  _requestSpecRaw: RequestSpecRaw,
): Promise<APIResult<RequestResponse>> {
  try {
    const sdk = requireSDK();
    const config = configStore.getConfig();
    const timeoutMs = config.queue.requestTimeoutSeconds * 1000;

    debugLog(
      `Sending HTTP request with timeout of ${config.queue.requestTimeoutSeconds}s`,
    );

    const result = await Promise.race([
      sdk.requests.send(_requestSpecRaw),
      new Promise<RequestResponse>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
      ),
    ]);

    debugLog(
      `Request completed with status: ${result.response?.getCode() ?? "no response"}`,
    );
    return {
      kind: "Ok",
      value: result,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    debugLog(`Request failed with error: ${errorMsg}`);
    return {
      kind: "Error",
      error: errorMsg,
    };
  }
}

export const requestGate = new RequestGate();
