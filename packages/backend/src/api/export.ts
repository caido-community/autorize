import { type APIResult } from "shared";

import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";

import { getRequestResponse } from "./utils";

type RequestResponseData = {
  requestRaw: string;
  responseRaw: string;
  code: number;
  length: number;
};

export type TemplateExportData = {
  id: number;
  method: string;
  url: string;
  baseline: RequestResponseData | undefined;
  mutated: {
    data: RequestResponseData | undefined;
    access: string | undefined;
  };
  noAuth: {
    data: RequestResponseData | undefined;
    access: string | undefined;
  };
};

function sanitizeText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

async function fetchSanitizedDataWithCode(
  sdk: BackendSDK,
  requestId: string,
): Promise<RequestResponseData | undefined> {
  try {
    const result = await getRequestResponse(sdk, requestId);
    if (result.kind === "Error") return undefined;

    const requestResult = await sdk.requests.get(requestId);
    const code = requestResult?.response?.getCode() ?? 0;

    return {
      requestRaw: sanitizeText(result.value.request.raw),
      responseRaw: sanitizeText(result.value.response.raw),
      code,
      length: result.value.response.raw.length,
    };
  } catch {
    return undefined;
  }
}

export async function getTemplatesExportData(
  sdk: BackendSDK,
  templateIds: number[],
): Promise<APIResult<TemplateExportData[]>> {
  const templates = templatesStore.getTemplates();
  const exportData: TemplateExportData[] = [];

  for (const id of templateIds) {
    const template = templates.find((t) => t.id === id);
    if (!template) continue;

    const baselineResult = template.results.find(
      (r) => r.kind === "Ok" && r.type === "baseline",
    );
    const mutatedResult = template.results.find(
      (r) => r.kind === "Ok" && r.type === "mutated",
    );
    const noAuthResult = template.results.find(
      (r) => r.kind === "Ok" && r.type === "no-auth",
    );

    const baselineData =
      baselineResult?.kind === "Ok"
        ? await fetchSanitizedDataWithCode(sdk, baselineResult.request.id)
        : undefined;

    const mutatedData =
      mutatedResult?.kind === "Ok"
        ? await fetchSanitizedDataWithCode(sdk, mutatedResult.request.id)
        : undefined;

    const noAuthData =
      noAuthResult?.kind === "Ok"
        ? await fetchSanitizedDataWithCode(sdk, noAuthResult.request.id)
        : undefined;

    exportData.push({
      id: template.id,
      method: template.request.method,
      url: template.request.url,
      baseline: baselineData,
      mutated: {
        data: mutatedData,
        access:
          mutatedResult?.kind === "Ok" && mutatedResult.type === "mutated"
            ? mutatedResult.accessState.kind
            : undefined,
      },
      noAuth: {
        data: noAuthData,
        access:
          noAuthResult?.kind === "Ok" && noAuthResult.type === "no-auth"
            ? noAuthResult.accessState.kind
            : undefined,
      },
    });
  }

  return { kind: "Ok", value: exportData };
}
