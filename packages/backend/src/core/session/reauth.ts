import { type RequestResponse, RequestSpec } from "caido:utils";
import { type APIResult, type ReauthRequest } from "shared";

import { debugLog, resolveEnvVariables } from "../../utils";
import { requestGate } from "../requests-gate";

export async function sendReauthRequest(
  config: ReauthRequest,
): Promise<APIResult<RequestResponse>> {
  const resolvedRaw = resolveEnvVariables(config.raw);

  let spec: RequestSpec;
  try {
    spec = RequestSpec.parse(resolvedRaw);
  } catch {
    return {
      kind: "Error",
      error:
        "Failed to parse re-auth request. Make sure it is a valid HTTP request with a Host header.",
    };
  }

  spec.setTls(config.tls);

  debugLog(`Sending re-auth request to ${spec.getHost()}:${spec.getPort()}`);

  return requestGate.wrapSend(spec.getRaw());
}
