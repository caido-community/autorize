import { type APIResult, type Template } from "shared";

import { jobsQueue } from "../core/queue";
import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";

export function deleteTemplates(
  _sdk: BackendSDK,
  templateIds: number[],
): APIResult<number> {
  if (templateIds.length === 0) {
    return { kind: "Ok", value: 0 };
  }

  jobsQueue.clear();

  let deletedCount = 0;
  for (const id of templateIds) {
    const templates = templatesStore.getTemplates();
    const template = templates.find((t: Template) => t.id === id);
    if (template) {
      templatesStore.deleteTemplate(id);
      deletedCount++;
    }
  }

  return { kind: "Ok", value: deletedCount };
}

export type RequestResponseData = {
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
  // Remove null bytes and other non-printable characters that break CSV/text
  // Keep common whitespace (newlines, tabs, etc)
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

async function fetchRequestResponse(
  sdk: BackendSDK,
  requestId: string,
): Promise<RequestResponseData | undefined> {
  try {
    const result = await sdk.requests.get(requestId);
    if (!result) return undefined;

    const requestRaw = sanitizeText(result.request.getRaw().toText());
    const responseRaw = sanitizeText(result.response?.getRaw().toText() ?? "");
    const code = result.response?.getCode() ?? 0;
    const length = result.response?.getRaw().toBytes().length ?? 0;

    return { requestRaw, responseRaw, code, length };
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
        ? await fetchRequestResponse(sdk, baselineResult.request.id)
        : undefined;

    const mutatedData =
      mutatedResult?.kind === "Ok"
        ? await fetchRequestResponse(sdk, mutatedResult.request.id)
        : undefined;

    const noAuthData =
      noAuthResult?.kind === "Ok"
        ? await fetchRequestResponse(sdk, noAuthResult.request.id)
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

