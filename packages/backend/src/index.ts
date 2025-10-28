import type { DefineAPI } from "caido:plugin";

import {
  clearAllTemplates,
  clearQueue,
  createTemplate,
  deleteTemplate,
  getConfig,
  getRequestResponse,
  getTemplate,
  getTemplates,
  rerunTemplate,
  rescanAllTemplates,
  updateConfig,
} from "./api";
import { initPassiveListener } from "./core/passive";
import { setSDK } from "./sdk";
import { configStore } from "./stores/config";
import { templatesStore } from "./stores/templates";
import { type BackendSDK } from "./types";

export { type BackendEvents } from "./types";

export type API = DefineAPI<{
  getTemplates: typeof getTemplates;
  getTemplate: typeof getTemplate;
  createTemplate: typeof createTemplate;
  deleteTemplate: typeof deleteTemplate;
  updateConfig: typeof updateConfig;
  getConfig: typeof getConfig;
  rerunTemplate: typeof rerunTemplate;
  clearQueue: typeof clearQueue;
  getRequestResponse: typeof getRequestResponse;
  clearAllTemplates: typeof clearAllTemplates;
  rescanAllTemplates: typeof rescanAllTemplates;
}>;

export function init(sdk: BackendSDK) {
  setSDK(sdk);

  configStore.initialize();
  templatesStore.initialize();

  sdk.api.register("getTemplates", getTemplates);
  sdk.api.register("getTemplate", getTemplate);
  sdk.api.register("createTemplate", createTemplate);
  sdk.api.register("deleteTemplate", deleteTemplate);
  sdk.api.register("rerunTemplate", rerunTemplate);
  sdk.api.register("updateConfig", updateConfig);
  sdk.api.register("getConfig", getConfig);
  sdk.api.register("clearQueue", clearQueue);
  sdk.api.register("getRequestResponse", getRequestResponse);
  sdk.api.register("clearAllTemplates", clearAllTemplates);
  sdk.api.register("rescanAllTemplates", rescanAllTemplates);

  initPassiveListener(sdk);

  sdk.events.onProjectChange(async (sdk, project) => {
    const projectID = project?.getId();

    clearQueue(sdk);
    sdk.api.send("cursor:clear");
    await configStore.switchProject(projectID);
    await templatesStore.switchProject(projectID);

    sdk.api.send("project:changed", projectID);
  });
}
