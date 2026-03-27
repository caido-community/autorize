import { type APIResult, type Template } from "shared";

import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";

async function matchesQuery(
  sdk: BackendSDK,
  template: Template,
  httpqlQuery: string,
): Promise<boolean> {
  const result = await sdk.requests.get(template.request.id);
  if (!result) return false;

  return sdk.requests.matches(httpqlQuery, result.request, result.response);
}

export async function filterTemplates(
  sdk: BackendSDK,
  httpqlQuery: string,
): Promise<APIResult<number[]>> {
  if (httpqlQuery === "") {
    const templates = templatesStore.getTemplates();
    return { kind: "Ok", value: templates.map((t) => t.id) };
  }

  const templates = templatesStore.getTemplates();
  const matchingTemplateIds: number[] = [];

  for (const template of templates) {
    try {
      if (await matchesQuery(sdk, template, httpqlQuery)) {
        matchingTemplateIds.push(template.id);
      }
    } catch {
      continue;
    }
  }

  return { kind: "Ok", value: matchingTemplateIds };
}

export async function filterTemplate(
  sdk: BackendSDK,
  httpqlQuery: string,
  templateId: number,
): Promise<APIResult<boolean>> {
  if (httpqlQuery === "") {
    return { kind: "Ok", value: true };
  }

  const template = templatesStore
    .getTemplates()
    .find((t) => t.id === templateId);

  if (!template) {
    return { kind: "Ok", value: false };
  }

  try {
    return {
      kind: "Ok",
      value: await matchesQuery(sdk, template, httpqlQuery),
    };
  } catch {
    return { kind: "Ok", value: false };
  }
}
