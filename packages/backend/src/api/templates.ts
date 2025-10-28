import { type APIResult, type Template } from "shared";

import { jobsQueue } from "../core/queue";
import { configStore } from "../stores/config";
import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";
import { debugLog } from "../utils";

export function getTemplates(_sdk: BackendSDK): APIResult<Template[]> {
  return { kind: "Ok", value: templatesStore.getTemplates() };
}

export function getTemplate(_sdk: BackendSDK, id: number): APIResult<Template> {
  const templates = templatesStore.getTemplates();
  const template = templates.find((tmpl) => tmpl.id === id);
  if (!template) {
    return { kind: "Error", error: "Template not found" };
  }
  return { kind: "Ok", value: template };
}

export const createTemplate = async (
  _sdk: BackendSDK,
  requestID: string,
): Promise<APIResult<Template>> => {
  const result = await _sdk.requests.get(requestID);
  if (!result) {
    return { kind: "Error", error: "Request not found" };
  }

  if (!result.response) {
    return { kind: "Error", error: "Response not found" };
  }

  const template = jobsQueue.addRequest(result.request, result.response, {
    force: true,
  });
  if (template.kind === "Error") {
    return { kind: "Error", error: template.reason };
  }

  return { kind: "Ok", value: template.template };
};

export function deleteTemplate(
  _sdk: BackendSDK,
  templateId: number,
): APIResult<void> {
  debugLog(`deleteTemplate API called for template ${templateId}`);

  const templates = templatesStore.getTemplates();
  const template = templates.find((tmpl: Template) => tmpl.id === templateId);
  if (!template) {
    debugLog(`deleteTemplate failed: template ${templateId} not found`);
    return { kind: "Error", error: "Template not found" };
  }

  templatesStore.deleteTemplate(templateId);
  debugLog(`Template ${templateId} deleted successfully`);
  return { kind: "Ok", value: undefined };
}

export function rerunTemplate(
  _sdk: BackendSDK,
  templateId: number,
): APIResult<void> {
  const config = configStore.getConfig();
  const anyMutatedMutations = config.mutations.some(
    (m) => m.type === "mutated",
  );
  if (!anyMutatedMutations) {
    debugLog("rerunTemplate rejected: no mutated mutations configured");
    return {
      kind: "Error",
      error:
        "Please configure authorization for the second user first to rerun templates",
    };
  }

  jobsQueue.rerunTemplate(templateId);
  return { kind: "Ok", value: undefined };
}

export function clearQueue(_sdk: BackendSDK): APIResult<void> {
  debugLog("clearQueue API called");

  jobsQueue.clear();
  debugLog("Queue cleared successfully");
  return { kind: "Ok", value: undefined };
}

export function clearAllTemplates(_sdk: BackendSDK): APIResult<void> {
  const templates = templatesStore.getTemplates();
  debugLog(`clearAllTemplates API called, ${templates.length} templates exist`);

  if (templates.length === 0) {
    debugLog("No templates to clear");
    return { kind: "Ok", value: undefined };
  }

  debugLog("Clearing job queue before deleting templates");
  jobsQueue.clear();

  const templateIds = templates.map((tmpl) => tmpl.id);
  _sdk.api.send("templates:cleared");

  debugLog(`Deleting ${templateIds.length} templates`);
  for (const id of templateIds) {
    templatesStore.deleteTemplate(id);
  }

  debugLog("All templates cleared successfully");
  return { kind: "Ok", value: undefined };
}

export function rescanAllTemplates(_sdk: BackendSDK): APIResult<void> {
  const config = configStore.getConfig();
  debugLog("rescanAllTemplates API called");

  if (config.mutations.length === 0) {
    debugLog("rescanAllTemplates rejected: no mutations configured");
    return {
      kind: "Error",
      error: "Please configure authorization for the second user first",
    };
  }

  debugLog("Clearing job queue before rescanning templates");
  jobsQueue.clear();

  const templates = templatesStore.getTemplates();
  const templateIds = templates.map((tmpl) => tmpl.id);

  debugLog(`Rescanning ${templateIds.length} templates`);
  for (const id of templateIds) {
    jobsQueue.rerunTemplate(id);
  }

  debugLog("All templates queued for rescanning");
  return { kind: "Ok", value: undefined };
}
