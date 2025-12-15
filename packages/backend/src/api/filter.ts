import { type APIResult } from "shared";

import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";

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
      const result = await sdk.requests.get(template.request.id);

      if (!result) continue;

      const matches = sdk.requests.matches(
        httpqlQuery,
        result.request,
        result.response,
      );

      if (matches) {
        matchingTemplateIds.push(template.id);
      }
    } catch {
      continue;
    }
  }

  return { kind: "Ok", value: matchingTemplateIds };
}
