export type RequestResponseData = {
  requestRaw: string;
  responseRaw: string;
  code: number;
  length: number;
};

export type MutatedResultData = {
  userProfileId: string | undefined;
  userProfileName: string | undefined;
  data: RequestResponseData | undefined;
  access: string | undefined;
};

export type TemplateExportData = {
  id: number;
  method: string;
  url: string;
  baseline: RequestResponseData | undefined;
  mutatedResults: MutatedResultData[];
  noAuth: {
    data: RequestResponseData | undefined;
    access: string | undefined;
  };
};

export type RequestResponseResult = {
  request: { id: string; raw: string };
  response: { id: string; raw: string };
  connectionInfo: {
    host: string;
    port: number;
    isTLS: boolean;
  };
};
