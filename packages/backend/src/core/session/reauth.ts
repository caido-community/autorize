import { type RequestResponse, RequestSpec } from "caido:utils";
import { type APIResult, type ReauthRequest } from "shared";

import { debugLog, resolveEnvVariables, Uint8ArrayToString } from "../../utils";
import { requestGate } from "../requests-gate";

import { resolvePort } from "./connection";

export async function sendReauthRequest(
  config: ReauthRequest,
): Promise<APIResult<RequestResponse>> {
  const resolvedRaw = resolveEnvVariables(config.raw).replace(/\r?\n/g, "\r\n");

  const unresolved = resolvedRaw.match(/\{\{\s*[A-Za-z0-9_]+\s*\}\}/g);
  if (unresolved !== null) {
    debugLog(
      `Re-auth request has unresolved variables: ${unresolved.join(", ")}`,
    );
  }

  let spec: RequestSpec;
  try {
    spec = RequestSpec.parse(resolvedRaw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    debugLog(`Failed to parse re-auth request: ${reason}`);
    return {
      kind: "Error",
      error: `Failed to parse re-auth request: ${reason}`,
    };
  }

  spec.setTls(config.tls);

  const body = spec.getBody();
  if (body !== undefined) {
    spec.setBody(body, { updateContentLength: true });
  }

  const host = spec.getHeader("Host")?.[0] ?? "";
  spec.setPort(resolvePort(host, config.tls));

  const raw = spec.getRaw();

  debugLog(
    `Sending re-auth request to ${spec.getHost()}:${spec.getPort()} (tls=${config.tls})`,
  );
  debugLog(`Re-auth request:\n${Uint8ArrayToString(raw.getRaw())}`);

  const result = await requestGate.wrapSend(raw);
  if (result.kind === "Error") {
    debugLog(`Re-auth request send failed: ${result.error}`);
  }

  return result;
}
