import { type TokenExtraction } from "shared";

import { requireSDK } from "../../sdk";
import { debugLog } from "../../utils";

export async function storeTokens(
  tokens: Map<string, string>,
  extractions: TokenExtraction[],
): Promise<void> {
  const sdk = requireSDK();

  for (const [envVar, value] of tokens) {
    const extraction = extractions.find((e) => e.envVar === envVar);
    const secret = extraction?.secret ?? false;

    await sdk.env.setVar({
      name: envVar,
      value,
      secret,
      global: false,
    });

    debugLog(`Stored token in env var "${envVar}" (secret=${secret})`);
  }
}
