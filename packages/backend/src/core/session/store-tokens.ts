import { type APIResult } from "shared";

import { requireSDK } from "../../sdk";
import { type BackendSDK } from "../../types";
import { debugLog } from "../../utils";

export async function storeTokens(
  tokens: Map<string, string>,
): Promise<APIResult<void>> {
  const sdk = requireSDK();

  for (const [envVar, value] of tokens) {
    let stored = await trySetVar(sdk, envVar, value, false);
    if (!stored) {
      debugLog(`No environment selected; storing "${envVar}" globally`);
      stored = await trySetVar(sdk, envVar, value, true);
    }

    if (!stored) {
      return {
        kind: "Error",
        error: `Failed to store refreshed token "${envVar}".`,
      };
    }

    debugLog(`Stored token in env var "${envVar}"`);
  }

  return { kind: "Ok", value: undefined };
}

async function trySetVar(
  sdk: BackendSDK,
  name: string,
  value: string,
  global: boolean,
): Promise<boolean> {
  try {
    await sdk.env.setVar({ name, value, secret: true, global });
    return true;
  } catch {
    return false;
  }
}
