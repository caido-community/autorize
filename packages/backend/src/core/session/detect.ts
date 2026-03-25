import { type Request, type Response } from "caido:utils";

import { requireSDK } from "../../sdk";
import { debugLog } from "../../utils";

export function isSessionInvalid(
  httpql: string,
  request: Request,
  response: Response,
): boolean {
  if (httpql === "") return false;

  const sdk = requireSDK();

  try {
    const matches = sdk.requests.matches(httpql, request, response);
    if (matches) {
      debugLog(
        `Session invalid detected for ${request.getUrl()} (matched: ${httpql})`,
      );
    }
    return matches;
  } catch (error) {
    debugLog(`Failed to evaluate session httpql "${httpql}":`, error);
    return false;
  }
}
