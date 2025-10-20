import type { Request } from "caido:utils";
import { z } from "zod";

import { configStore } from "../stores/config";
import { type BackendSDK } from "../types";

import { jobsQueue } from "./queue";

const FilterPresetSchema = z.object({
  __typename: z.literal("FilterPreset"),
  id: z.string(),
  alias: z.string(),
  name: z.string(),
  clause: z.string(),
});

const FilterPresetsResponseSchema = z.object({
  data: z.object({
    filterPresets: z.array(FilterPresetSchema),
  }),
});

type FilterPreset = z.infer<typeof FilterPresetSchema>;

const getFilterPresets = async (sdk: BackendSDK): Promise<FilterPreset[]> => {
  const response = await sdk.graphql.execute(`
    query filterPresets {
      filterPresets {
        __typename
        id
        alias
        name
        clause
      }
    }
  `);

  const result = FilterPresetsResponseSchema.safeParse(response);
  if (!result.success) {
    return [];
  }

  return result.data.data.filterPresets;
};

export const initPassiveListener = (sdk: BackendSDK) => {
  sdk.events.onInterceptResponse(async (_, request, response) => {
    const shouldProcess = await shouldProcessRequest(request, sdk);
    if (!shouldProcess) return;

    jobsQueue.addRequest(request, response);
  });
};
// Here we control which passive requests are being sent to the Autorize plugin queue
const shouldProcessRequest = async (request: Request, sdk: BackendSDK) => {
  const config = configStore.getConfig();
  const requestPath = request.getPath();
  const requestHost = request.getHost();
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

  // Skip known non-interesting endpoints
  if (requestPath.startsWith("/cdn-cgi/challenge-platform/")) {
    return false;
  }

  // Skip analytics and tracking hosts
  const analyticsHosts = [
    "geolocation.onetrust.com",
    "cdn.cookielaw.org",
    "use.typekit.net",
    "www.google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "connect.facebook.net",
    "hotjar.com",
    "mixpanel.com",
    "segment.com",
    "amplitude.com",
    "fullstory.com",
    "intercom.io",
  ];
  if (analyticsHosts.includes(requestHost)) {
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

  // If filters are set, make sure request matches all of them
  if (config.passiveFiltering.filters.length > 0) {
    const filterPresets = await getFilterPresets(sdk);
    const selectedFilters = filterPresets.filter((f) =>
      config.passiveFiltering.filters.includes(f.id),
    );

    for (const filter of selectedFilters) {
      const matchesFilter = sdk.requests.matches(filter.clause, request);
      if (!matchesFilter) return false;
    }
  }

  return true;
};
