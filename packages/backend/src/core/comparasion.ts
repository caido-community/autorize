import { type Response } from "caido:utils";
import { type AccessState } from "shared";

import { stringSimilarity } from "../utils";

export function determineAccessState(
  baseline: Response,
  mutated: Response,
): AccessState {
  const rawResult = mutated.getRaw().toText();
  const rawBaseline = baseline.getRaw().toText();

  // Same length
  if (rawResult.length === rawBaseline.length) {
    return { kind: "authorized", confidence: 1 };
  }

  // Clear denial indicators
  if (
    [401, 403].includes(mutated.getCode()) &&
    ![401, 403].includes(baseline.getCode())
  ) {
    return { kind: "unauthorized", confidence: 1 };
  }

  // Same code
  if (mutated.getCode() === baseline.getCode()) {
    const similarity = stringSimilarity(rawResult, rawBaseline);
    const isSignificantSimilarity = similarity > 0.9;
    if (isSignificantSimilarity) {
      return { kind: "authorized", confidence: similarity };
    }
  }

  // Clear denial indicators
  if (mutated.getCode() === 404 && baseline.getCode() !== 404) {
    return { kind: "unauthorized", confidence: 1 };
  }

  return { kind: "uncertain", confidence: 0 };
}
