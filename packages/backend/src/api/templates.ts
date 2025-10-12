import { type APIResult, type Template } from "shared";

import { jobsQueue } from "../core/queue";
import { configStore } from "../stores/config";
import { templatesStore } from "../stores/templates";
import { type BackendSDK } from "../types";

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
  const templates = templatesStore.getTemplates();
  const template = templates.find((tmpl: Template) => tmpl.id === templateId);
  if (!template) {
    return { kind: "Error", error: "Template not found" };
  }

  templatesStore.deleteTemplate(templateId);
  return { kind: "Ok", value: undefined };
}

export function rerunTemplate(
  _sdk: BackendSDK,
  templateId: number,
): APIResult<void> {
  const config = configStore.getConfig();
  if (config.mutations.length === 0) {
    return {
      kind: "Error",
      error: "Please configure authorization for the second user first",
    };
  }

  jobsQueue.rerunTemplate(templateId);
  return { kind: "Ok", value: undefined };
}

export function clearQueue(_sdk: BackendSDK): APIResult<void> {
  const config = configStore.getConfig();

  if (!config.enabled) {
    return { kind: "Error", error: "Plugin must be enabled to control queue" };
  }

  jobsQueue.clear();
  return { kind: "Ok", value: undefined };
}

export function clearAllTemplates(_sdk: BackendSDK): APIResult<void> {
  const templates = templatesStore.getTemplates();
  if (templates.length === 0) {
    return { kind: "Ok", value: undefined };
  }

  const templateIds = templates.map((tmpl) => tmpl.id);
  _sdk.api.send("templates:cleared");

  for (const id of templateIds) {
    templatesStore.deleteTemplate(id);
  }

  return { kind: "Ok", value: undefined };
}

export function rescanAllTemplates(_sdk: BackendSDK): APIResult<void> {
  const config = configStore.getConfig();
  if (config.mutations.length === 0) {
    return {
      kind: "Error",
      error: "Please configure authorization for the second user first",
    };
  }

  const templates = templatesStore.getTemplates();
  const templateIds = templates.map((tmpl) => tmpl.id);

  for (const id of templateIds) {
    jobsQueue.rerunTemplate(id);
  }

  return { kind: "Ok", value: undefined };
}
