import type { Response } from "caido:utils";
import { describe, expect, it } from "vitest";

import { determineAccessState } from "./comparasion";

function mockResponse(code: number, body: string): Response {
  return {
    getRaw: () => ({ toText: () => body }),
    getCode: () => code,
  } as unknown as Response;
}

describe("determineAccessState", () => {
  it("returns authorized with confidence 1 when response lengths match", () => {
    const baseline = mockResponse(200, "same body");
    const mutated = mockResponse(200, "same body");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("authorized");
    expect(result.confidence).toBe(1);
  });

  it("returns unauthorized with confidence 1 for 401 status", () => {
    const baseline = mockResponse(200, "ok");
    const mutated = mockResponse(401, "unauthorized response body");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("unauthorized");
    expect(result.confidence).toBe(1);
  });

  it("returns unauthorized with confidence 1 for 403 status", () => {
    const baseline = mockResponse(200, "ok");
    const mutated = mockResponse(403, "forbidden response body");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("unauthorized");
    expect(result.confidence).toBe(1);
  });

  it("returns authorized when same code and high similarity", () => {
    const baseline = mockResponse(200, "response body with some content here");
    const mutated = mockResponse(200, "response body with some content hera");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("authorized");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("returns unauthorized when mutated is 404 and baseline is not", () => {
    const baseline = mockResponse(200, "normal response");
    const mutated = mockResponse(404, "not found page content");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("unauthorized");
    expect(result.confidence).toBe(1);
  });

  it("returns uncertain when no heuristic matches", () => {
    const baseline = mockResponse(200, "original page content with data");
    const mutated = mockResponse(302, "redirect to login page");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("uncertain");
    expect(result.confidence).toBe(0);
  });

  it("does not flag 404 when baseline is also 404", () => {
    const baseline = mockResponse(404, "not found A");
    const mutated = mockResponse(404, "not found completely different page");
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).not.toBe("unauthorized");
  });

  it("returns uncertain for same code but low similarity", () => {
    const baseline = mockResponse(
      200,
      "completely different content here abcdefghijklmnop",
    );
    const mutated = mockResponse(
      200,
      "xyz totally unrelated response qrstuvwxyz1234567",
    );
    const result = determineAccessState(baseline, mutated);
    expect(result.kind).toBe("uncertain");
  });
});
