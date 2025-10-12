import { type APIResult } from "shared";

import { type BackendSDK } from "../types";
import { Uint8ArrayToString } from "../utils";

export const getRequestResponse = async (
  sdk: BackendSDK,
  requestId: string,
): Promise<
  APIResult<{
    request: { id: string; raw: string };
    response: { id: string; raw: string };
    connectionInfo: {
      host: string;
      port: number;
      isTLS: boolean;
    };
  }>
> => {
  const result = await sdk.requests.get(requestId);

  if (!result) {
    return { kind: "Error", error: "Request not found" };
  }

  const { request, response } = result;

  if (!response) {
    return { kind: "Error", error: "Response not found" };
  }

  return {
    kind: "Ok",
    value: {
      request: {
        id: request.getId(),
        raw: Uint8ArrayToString(request.toSpecRaw().getRaw()),
      },
      response: {
        id: response.getId(),
        raw: response.getRaw().toText(),
      },
      connectionInfo: {
        host: request.getHost(),
        port: request.getPort(),
        isTLS: request.getTls(),
      },
    },
  };
};
