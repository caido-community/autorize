import { type DefineEvents, type SDK } from "caido:plugin";
import { type Template } from "shared";

import { type API } from ".";

export type BackendSDK = SDK<API, BackendEvents>;
export type BackendEvents = DefineEvents<{
  "template:created": (template: Template) => void;
  "template:updated": (templateId: number, template: Template) => void;
  "template:deleted": (templateId: number) => void;
  "templates:cleared": () => void;
  "project:changed": (projectID: string | undefined) => void;
  "queue:status-changed": (hasActiveJobs: boolean) => void;
}>;
