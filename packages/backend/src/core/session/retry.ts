import {
  type Request,
  type RequestResponse,
  type RequestSpecRaw,
} from "caido:utils";
import { type ProfileMutation, type SessionManagement } from "shared";

import { debugLog } from "../../utils";
import { requestGate } from "../requests-gate";

import { isSessionInvalid } from "./detect";
import { handleInvalidSession } from "./handler";

export type RetryParams = {
  profileId: string;
  sessionConfig: SessionManagement;
  baselineRaw: string;
  mutations: ProfileMutation[];
  originalRequest: Request;
  applyMutations: (raw: string, mutations: ProfileMutation[]) => string;
  buildSpec: (raw: string, request: Request) => RequestSpecRaw;
};

export type SessionRetryResult = {
  value: RequestResponse;
  retryReason?: string;
};

export async function retryWithSession(
  params: RetryParams,
  currentResponse: RequestResponse,
): Promise<SessionRetryResult> {
  const { sessionConfig, profileId } = params;
  const maxRetries = sessionConfig.maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    debugLog(
      `Session retry attempt ${attempt}/${maxRetries} for profile ${profileId}`,
    );

    const handleResult = await handleInvalidSession(profileId, sessionConfig);
    if (handleResult.kind === "Error") {
      debugLog(`Re-auth failed on attempt ${attempt}: ${handleResult.error}`);
      return { value: currentResponse, retryReason: handleResult.error };
    }

    const retriedRaw = params.applyMutations(
      params.baselineRaw,
      params.mutations,
    );
    const retriedSpec = params.buildSpec(retriedRaw, params.originalRequest);
    const retriedResult = await requestGate.wrapSend(retriedSpec);

    if (retriedResult.kind === "Error") {
      return {
        value: currentResponse,
        retryReason: `Retry request failed: ${retriedResult.error}`,
      };
    }

    const retriedResponse = retriedResult.value.response;
    if (retriedResponse === undefined) {
      return {
        value: currentResponse,
        retryReason: "Retry request returned no response",
      };
    }

    const stillInvalid = isSessionInvalid(
      sessionConfig.invalidSessionHttpql,
      params.originalRequest,
      retriedResponse,
    );

    if (!stillInvalid) {
      debugLog(`Session retry succeeded on attempt ${attempt}`);
      return { value: retriedResult.value };
    }

    currentResponse = retriedResult.value;
  }

  debugLog(`Session retry exhausted all ${maxRetries} attempts`);
  return {
    value: currentResponse,
    retryReason: `Session still invalid after ${maxRetries} re-auth attempt(s)`,
  };
}
