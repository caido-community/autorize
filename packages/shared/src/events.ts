import type { Template } from ".";

export type Events = {
  "template:created": (template: Template) => void;
  "template:updated": (templateId: number, template: Template) => void;
  "template:deleted": (templateId: number) => void;
  "templates:cleared": () => void;
  "project:changed": (projectID: string | undefined) => void;
  "queue:status-changed": (hasActiveJobs: boolean) => void;
  "cursor:mark": (templateId: number, active: boolean) => void;
  "cursor:clear": () => void;
};
