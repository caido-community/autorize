import { type APIResult, type Config, type Template } from "shared";

import { jobsQueue } from "./queue";
import { store } from "./store";
import { type BackendSDK } from "./types";
import { Uint8ArrayToString } from "./utils";

export function getTemplates(_sdk: BackendSDK): APIResult<Template[]> {
  return { kind: "Ok", value: store.getState().templates };
}

export function getTemplate(_sdk: BackendSDK, id: number): APIResult<Template> {
  const state = store.getState();
  const template = state.templates.find((t) => t.id === id);
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

export function updateConfig(
  _sdk: BackendSDK,
  config: Partial<Config>,
): APIResult<void> {
  const currentState = store.getState();

  const nonEnabledFields = Object.keys(config).filter(
    (key) => key !== "enabled" && key !== "ui",
  );
  if (currentState.config.enabled && nonEnabledFields.length > 0) {
    return {
      kind: "Error",
      error:
        "Cannot modify configuration while plugin is enabled. Disable first.",
    };
  }

  if (config.enabled === true && currentState.config.mutations.length === 0) {
    return {
      kind: "Error",
      error:
        "Cannot enable plugin without second-user authorization mutations configured.",
    };
  }

  store.updateConfig(config);
  return { kind: "Ok", value: undefined };
}

export function getConfig(_sdk: BackendSDK): APIResult<Config> {
  return { kind: "Ok", value: store.getState().config };
}

export function deleteTemplate(
  _sdk: BackendSDK,
  templateId: number,
): APIResult<void> {
  const state = store.getState();
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) {
    return { kind: "Error", error: "Template not found" };
  }

  store.deleteTemplate(templateId);
  return { kind: "Ok", value: undefined };
}

export function rerunTemplate(
  _sdk: BackendSDK,
  templateId: number,
): APIResult<void> {
  if (store.getState().config.mutations.length === 0) {
    return {
      kind: "Error",
      error: "Please configure authorization for the second user first",
    };
  }

  jobsQueue.rerunTemplate(templateId);
  return { kind: "Ok", value: undefined };
}

export function pauseQueue(_sdk: BackendSDK): APIResult<void> {
  const { config } = store.getState();

  if (!config.enabled) {
    return { kind: "Error", error: "Plugin must be enabled to control queue" };
  }

  jobsQueue.pause();
  return { kind: "Ok", value: undefined };
}

export function resumeQueue(_sdk: BackendSDK): APIResult<void> {
  const { config } = store.getState();

  if (!config.enabled) {
    return { kind: "Error", error: "Plugin must be enabled to control queue" };
  }

  jobsQueue.resume();
  return { kind: "Ok", value: undefined };
}

export function clearQueue(_sdk: BackendSDK): APIResult<void> {
  const { config } = store.getState();

  if (!config.enabled) {
    return { kind: "Error", error: "Plugin must be enabled to control queue" };
  }

  jobsQueue.clear();
  return { kind: "Ok", value: undefined };
}

export const getRequestResponse = async (
  sdk: BackendSDK,
  requestId: string,
): Promise<
  APIResult<{
    request: { id: string; raw: string };
    response: { id: string; raw: string };
    connectionInfo: {
      host: string;
      port: number;
      isTLS: boolean;
    };
  }>
> => {
  const result = await sdk.requests.get(requestId);

  if (!result) {
    return { kind: "Error", error: "Request not found" };
  }

  const { request, response } = result;

  if (!response) {
    return { kind: "Error", error: "Response not found" };
  }

  return {
    kind: "Ok",
    value: {
      request: {
        id: request.getId(),
        raw: Uint8ArrayToString(request.toSpecRaw().getRaw()),
      },
      response: {
        id: response.getId(),
        raw: response.getRaw().toText(),
      },
      connectionInfo: {
        host: request.getHost(),
        port: request.getPort(),
        isTLS: request.getTls(),
      },
    },
  };
};

export function clearAllTemplates(_sdk: BackendSDK): APIResult<void> {
  const state = store.getState();
  const templateIds = state.templates.map((t) => t.id);
  _sdk.api.send("templates:cleared");

  for (const id of templateIds) {
    store.deleteTemplate(id);
  }

  return { kind: "Ok", value: undefined };
}

export function rescanAllTemplates(_sdk: BackendSDK): APIResult<void> {
  if (store.getState().config.mutations.length === 0) {
    return {
      kind: "Error",
      error: "Please configure authorization for the second user first",
    };
  }

  const state = store.getState();
  const templateIds = state.templates.map((t) => t.id);

  for (const id of templateIds) {
    jobsQueue.rerunTemplate(id);
  }

  return { kind: "Ok", value: undefined };
}
