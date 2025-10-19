import type { Request } from "caido:utils";

import { configStore } from "../stores/config";
import { type BackendSDK } from "../types";

import { jobsQueue } from "./queue";

export const initPassiveListener = (sdk: BackendSDK) => {
  sdk.events.onInterceptResponse((_, request, response) => {
    const shouldProcess = shouldProcessRequest(request, sdk);
    if (!shouldProcess) return;

    jobsQueue.addRequest(request, response);
  });
};

// Here we control which passive requests are being sent to the Autorize plugin queue
const shouldProcessRequest = (request: Request, sdk: BackendSDK) => {
  const config = configStore.getConfig();
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
    ".webp",
  ];

  // Skip OPTIONS method requests
  if (request.getMethod() === "OPTIONS") {
    return false;
  }

  // Skip some file extensions
  if (staticFileExtensions.some((ext) => requestPath.endsWith(ext))) {
    return false;
  }

  // If onlyInScope is enabled, make sure request is in scope
  if (config.passiveFiltering.onlyInScope) {
    const inScope = sdk.requests.inScope(request);
    if (!inScope) return false;
  }

  // If httpql is set, make sure request matches the query
  if (config.passiveFiltering.httpql !== "") {
    const matchesHttpQL = sdk.requests.matches(
      config.passiveFiltering.httpql,
      request,
    );

    if (!matchesHttpQL) return false;
  }

  return true;
};
