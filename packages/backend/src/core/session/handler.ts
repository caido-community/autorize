import { type APIResult, type SessionManagement } from "shared";

import { debugLog } from "../../utils";

import { extractTokens } from "./extract";
import { sessionLockManager } from "./lock";
import { sendReauthRequest } from "./reauth";
import { storeTokens } from "./store-tokens";

export async function handleInvalidSession(
  profileId: string,
  sessionConfig: SessionManagement,
): Promise<APIResult<void>> {
  const release = await sessionLockManager.acquire(profileId);

  try {
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

    const extractResult = extractTokens(
      response,
      sessionConfig.tokenExtractions,
    );
    if (extractResult.kind === "Error") {
      return extractResult;
    }

    await storeTokens(extractResult.value, sessionConfig.tokenExtractions);

    debugLog(`Session refreshed successfully for profile ${profileId}`);
    return { kind: "Ok", value: undefined };
  } finally {
    release();
  }
}
