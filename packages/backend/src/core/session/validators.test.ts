import {
  ReauthRequestSchema,
  SessionManagementSchema,
  TokenExtractionSchema,
} from "shared";
import { describe, expect, it } from "vitest";

describe("TokenExtractionSchema", () => {
  it("accepts a valid Header extraction", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "Header",
      headerName: "Authorization",
      envVar: "TOKEN",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid JsonBody extraction", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "JsonBody",
      jsonPath: "data.token",
      envVar: "TOKEN",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid Regex extraction", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "Regex",
      pattern: "token=([a-f0-9]+)",
      envVar: "TOKEN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "Unknown",
      envVar: "TOKEN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty headerName", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "Header",
      headerName: "",
      envVar: "TOKEN",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty envVar", () => {
    const result = TokenExtractionSchema.safeParse({
      kind: "JsonBody",
      jsonPath: "token",
      envVar: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("ReauthRequestSchema", () => {
  it("accepts a valid reauth request", () => {
    const result = ReauthRequestSchema.safeParse({
      raw: "POST /login HTTP/1.1\r\nHost: example.com\r\n\r\n",
      tls: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty raw string", () => {
    const result = ReauthRequestSchema.safeParse({
      raw: "",
      tls: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing tls", () => {
    const result = ReauthRequestSchema.safeParse({
      raw: "GET / HTTP/1.1",
    });
    expect(result.success).toBe(false);
  });
});

describe("SessionManagementSchema", () => {
  it("accepts a valid full config", () => {
    const result = SessionManagementSchema.safeParse({
      enabled: true,
      invalidSessionHttpql: "res.code = 401",
      reauthRequest: {
        raw: "POST /login HTTP/1.1\r\nHost: example.com\r\n\r\n",
        tls: false,
      },
      tokenExtractions: [
        { kind: "JsonBody", jsonPath: "token", envVar: "TOKEN" },
      ],
      maxRetries: 2,
    });
    expect(result.success).toBe(true);
  });

  it("defaults maxRetries to 1", () => {
    const result = SessionManagementSchema.safeParse({
      enabled: false,
      invalidSessionHttpql: "",
      reauthRequest: { raw: "", tls: true },
      tokenExtractions: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxRetries).toBe(1);
    }
  });

  it("rejects maxRetries below 1", () => {
    const result = SessionManagementSchema.safeParse({
      enabled: true,
      invalidSessionHttpql: "",
      reauthRequest: { raw: "", tls: true },
      tokenExtractions: [],
      maxRetries: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxRetries above 3", () => {
    const result = SessionManagementSchema.safeParse({
      enabled: true,
      invalidSessionHttpql: "",
      reauthRequest: { raw: "", tls: true },
      tokenExtractions: [],
      maxRetries: 5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty tokenExtractions array", () => {
    const result = SessionManagementSchema.safeParse({
      enabled: true,
      invalidSessionHttpql: "",
      reauthRequest: { raw: "", tls: true },
      tokenExtractions: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing enabled field", () => {
    const result = SessionManagementSchema.safeParse({
      invalidSessionHttpql: "",
      reauthRequest: { raw: "", tls: true },
      tokenExtractions: [],
    });
    expect(result.success).toBe(false);
  });
});
