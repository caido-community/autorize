import { type Response } from "caido:utils";
import { type APIResult, type TokenExtraction } from "shared";

import { debugLog } from "../../utils";

export function extractTokens(
  response: Response,
  extractions: TokenExtraction[],
): APIResult<Map<string, string>> {
  const tokens = new Map<string, string>();

  for (const extraction of extractions) {
    const value = extractSingleToken(response, extraction);
    if (value === undefined) {
      return {
        kind: "Error",
        error: `Failed to extract token for env var "${extraction.envVar}" (${extraction.kind})`,
      };
    }
    tokens.set(extraction.envVar, value);
  }

  debugLog(`Extracted ${tokens.size} token(s) from re-auth response`);
  return { kind: "Ok", value: tokens };
}

function extractSingleToken(
  response: Response,
  extraction: TokenExtraction,
): string | undefined {
  switch (extraction.kind) {
    case "Header":
      return extractFromHeader(response, extraction.headerName);
    case "JsonBody":
      return extractFromJsonBody(response, extraction.jsonPath);
    case "Regex":
      return extractFromRegex(response, extraction.pattern);
  }
}

function extractFromHeader(
  response: Response,
  headerName: string,
): string | undefined {
  const values = response.getHeaders()[headerName.toLowerCase()];
  if (values === undefined || values.length === 0) return undefined;
  return values[0];
}

function extractFromJsonBody(
  response: Response,
  jsonPath: string,
): string | undefined {
  try {
    const body = response.getBody();
    if (!body) return undefined;

    const json = body.toJson();
    return navigateJsonPath(json, jsonPath);
  } catch {
    debugLog(`Failed to parse JSON body for path "${jsonPath}"`);
    return undefined;
  }
}

function extractFromRegex(
  response: Response,
  pattern: string,
): string | undefined {
  try {
    const body = response.getBody();
    if (!body) return undefined;

    const text = body.toText();
    return extractRegexCapture(text, pattern);
  } catch {
    debugLog(`Failed to apply regex pattern "${pattern}"`);
    return undefined;
  }
}

export function navigateJsonPath(
  json: unknown,
  jsonPath: string,
): string | undefined {
  const segments = jsonPath.split(".");
  let current: unknown = json;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  if (current === null || current === undefined) return undefined;
  if (typeof current === "object") return JSON.stringify(current);
  return String(current as string | number | boolean);
}

export function extractRegexCapture(
  text: string,
  pattern: string,
): string | undefined {
  const match = new RegExp(pattern).exec(text);
  return match?.[1] ?? undefined;
}
