import type { DefineAPI } from "caido:plugin";
import type { Request } from "caido:utils";

import * as api from "./api";
import { jobsQueue } from "./queue";
import { setSDK } from "./sdk";
import { store } from "./store";
import { type BackendSDK } from "./types";

export { type BackendEvents } from "./types";

export type API = DefineAPI<{
  getTemplates: typeof api.getTemplates;
  getTemplate: typeof api.getTemplate;
  createTemplate: typeof api.createTemplate;
  deleteTemplate: typeof api.deleteTemplate;
  updateConfig: typeof api.updateConfig;
  getConfig: typeof api.getConfig;
  rerunTemplate: typeof api.rerunTemplate;
  pauseQueue: typeof api.pauseQueue;
  resumeQueue: typeof api.resumeQueue;
  clearQueue: typeof api.clearQueue;
  getRequestResponse: typeof api.getRequestResponse;
  clearAllTemplates: typeof api.clearAllTemplates;
  rescanAllTemplates: typeof api.rescanAllTemplates;
}>;

export function init(sdk: BackendSDK) {
  setSDK(sdk);

  sdk.api.register("getTemplates", api.getTemplates);
  sdk.api.register("getTemplate", api.getTemplate);
  sdk.api.register("createTemplate", api.createTemplate);
  sdk.api.register("deleteTemplate", api.deleteTemplate);
  sdk.api.register("rerunTemplate", api.rerunTemplate);
  sdk.api.register("updateConfig", api.updateConfig);
  sdk.api.register("getConfig", api.getConfig);
  sdk.api.register("pauseQueue", api.pauseQueue);
  sdk.api.register("resumeQueue", api.resumeQueue);
  sdk.api.register("clearQueue", api.clearQueue);
  sdk.api.register("getRequestResponse", api.getRequestResponse);
  sdk.api.register("clearAllTemplates", api.clearAllTemplates);
  sdk.api.register("rescanAllTemplates", api.rescanAllTemplates);

  sdk.events.onInterceptResponse((_, request, response) => {
    const shouldProcess = shouldProcessRequest(request, sdk);
    if (!shouldProcess) return;

    jobsQueue.addRequest(request, response);
  });
}

const shouldProcessRequest = (request: Request, sdk: BackendSDK) => {
  const { config } = store.getState();
  const requestPath = request.getPath();
  const staticFileExtensions = [
    ".js",
    ".css",
    ".map",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];

  if (request.getMethod() === "OPTIONS") {
    return false;
  }

  if (staticFileExtensions.some((ext) => requestPath.endsWith(ext))) {
    return false;
  }

  if (config.passiveFiltering.onlyInScope) {
    return sdk.requests.inScope(request);
  }

  if (config.passiveFiltering.httpql !== "") {
    return sdk.requests.matches(config.passiveFiltering.httpql, request);
  }

  return true;
};
