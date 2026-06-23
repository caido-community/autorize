import { type APIResult, type SessionManagement } from "shared";

import { debugLog } from "../../utils";

import { extractTokens } from "./extract";
import { sessionLockManager } from "./lock";
import { sendReauthRequest } from "./reauth";
import { storeTokens } from "./store-tokens";

type HandleOptions = {
  force?: boolean;
};

export async function handleInvalidSession(
  profileId: string,
  sessionConfig: SessionManagement,
  options: HandleOptions = {},
): Promise<APIResult<void>> {
  const versionBefore = sessionLockManager.getRefreshVersion(profileId);
  const release = await sessionLockManager.acquire(profileId);

  try {
    if (options.force !== true) {
      const versionAfter = sessionLockManager.getRefreshVersion(profileId);
      if (versionAfter > versionBefore) {
        debugLog(
          `Session already refreshed for profile ${profileId}, skipping re-auth`,
        );
        return { kind: "Ok", value: undefined };
      }
    }

    const reauthResult = await sendReauthRequest(sessionConfig.reauthRequest);
    if (reauthResult.kind === "Error") {
      debugLog(
        `Re-auth failed for profile ${profileId}: ${reauthResult.error}`,
      );
      return {
        kind: "Error",
        error: `Re-auth request failed: ${reauthResult.error}`,
      };
    }

    const response = reauthResult.value.response;
    if (response === undefined) {
      return { kind: "Error", error: "Re-auth request returned no response" };
    }

    const code = response.getCode();
    if (code >= 400) {
      debugLog(`Re-auth response body: ${response.getBody()?.toText() ?? ""}`);
      return {
        kind: "Error",
        error: `Re-auth request rejected with HTTP ${code}`,
      };
    }

    const extractResult = extractTokens(
      response,
      sessionConfig.tokenExtractions,
    );
    if (extractResult.kind === "Error") {
      return extractResult;
    }

    await storeTokens(extractResult.value, sessionConfig.tokenExtractions);
    sessionLockManager.incrementRefreshVersion(profileId);

    debugLog(`Session refreshed successfully for profile ${profileId}`);
    return { kind: "Ok", value: undefined };
  } finally {
    release();
  }
}
