import type { RequestResponseResult, TemplateExportData } from "./export";

import type { APIResult, Config, Template } from ".";

export type API = {
  getTemplates: () => APIResult<Template[]>;
  getTemplate: (id: number) => APIResult<Template>;
  createTemplate: (requestID: string) => Promise<APIResult<Template>>;
  deleteTemplate: (templateId: number) => APIResult<void>;
  deleteTemplates: (templateIds: number[]) => APIResult<number>;
  updateConfig: (config: Partial<Config>) => APIResult<void>;
  getConfig: () => APIResult<Config>;
  rerunTemplate: (templateId: number) => APIResult<void>;
  clearQueue: () => APIResult<void>;
  getRequestResponse: (
    requestId: string,
  ) => Promise<APIResult<RequestResponseResult>>;
  clearAllTemplates: () => APIResult<void>;
  rescanAllTemplates: () => APIResult<void>;
  filterTemplate: (
    httpqlQuery: string,
    templateId: number,
  ) => Promise<APIResult<boolean>>;
  filterTemplates: (httpqlQuery: string) => Promise<APIResult<number[]>>;
  getTemplatesExportData: (
    templateIds: number[],
  ) => Promise<APIResult<TemplateExportData[]>>;
};
