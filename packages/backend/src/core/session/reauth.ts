import { type RequestResponse, RequestSpecRaw } from "caido:utils";
import { type APIResult, type ReauthRequest } from "shared";

import { debugLog, resolveEnvVariables } from "../../utils";
import { requestGate } from "../requests-gate";

function parseHostFromRaw(
  raw: string,
): { host: string; port?: number } | undefined {
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const match = /^Host:\s*(.+)$/i.exec(line);
    if (match?.[1] !== undefined) {
      const hostValue = match[1].trim();
      const colonIndex = hostValue.lastIndexOf(":");
      if (colonIndex > 0) {
        const host = hostValue.substring(0, colonIndex);
        const port = parseInt(hostValue.substring(colonIndex + 1), 10);
        if (!isNaN(port)) {
          return { host, port };
        }
      }
      return { host: hostValue };
    }
  }
  return undefined;
}

export async function sendReauthRequest(
  config: ReauthRequest,
): Promise<APIResult<RequestResponse>> {
  const resolvedRaw = resolveEnvVariables(config.raw);

  const hostInfo = parseHostFromRaw(resolvedRaw);
  if (hostInfo === undefined) {
    return {
      kind: "Error",
      error:
        "Could not parse Host header from re-auth request. Make sure your raw request includes a Host header.",
    };
  }

  const protocol = config.tls ? "https" : "http";
  const defaultPort = config.tls ? 443 : 80;
  const port = hostInfo.port ?? defaultPort;
  const url = `${protocol}://${hostInfo.host}:${port}`;

  const spec = new RequestSpecRaw(url);
  spec.setRaw(resolvedRaw);

  debugLog(`Sending re-auth request to ${hostInfo.host}:${port}`);

  return requestGate.wrapSend(spec);
}
