export type Config = {
  enabled: boolean;
  mutations: Mutation[];
  testNoAuth: boolean;
  queue: {
    maxConcurrentRequests: number;
    requestsPerSecond: number;
    paused: boolean;
  };
  ui: {
    showOnlyLengths: boolean;
  };
  passiveFiltering: {
    httpql: string;
    onlyInScope: boolean;
  };
};

export type Job = {
  id: string;
  templateId: number;
  baselineRequestId: string;
  status: "pending" | "running" | "completed" | "failed";
};

export type AccessState = {
  kind: "authorized" | "unauthorized" | "uncertain";
  confidence: number;
};

export type JobResult =
  | {
      kind: "Ok";
      type: "mutated" | "no-auth";
      request: {
        id: string;
        method: string;
        url: string;
      };
      response: {
        id: string;
        code: number;
        length: number;
      };
      accessState: AccessState;
    }
  | {
      kind: "Error";
      error: string;
    };

export type Template = {
  id: number;
  key: string;
  request: {
    id: string;
    method: string;
    url: string;
  };
  response: {
    id: string;
    code: number;
    length: number;
  };
  results: JobResult[];
};

export type Mutation =
  | {
      kind: "HeaderAdd";
      header: string;
      value: string;
    }
  | {
      kind: "HeaderRemove";
      header: string;
    }
  | {
      kind: "HeaderReplace";
      header: string;
      value: string;
    }
  | {
      kind: "RawMatchAndReplace";
      match: string;
      value: string;
    };

export type APIResult<T> =
  | { kind: "Error"; error: string }
  | { kind: "Ok"; value: T };
