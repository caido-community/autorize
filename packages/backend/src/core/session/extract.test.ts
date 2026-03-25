import { describe, expect, it } from "vitest";

import { extractRegexCapture, navigateJsonPath } from "./extract";

describe("navigateJsonPath", () => {
  it("extracts a top-level string value", () => {
    const json = { token: "abc123" };
    expect(navigateJsonPath(json, "token")).toBe("abc123");
  });

  it("extracts a nested value", () => {
    const json = { data: { access: { token: "nested-value" } } };
    expect(navigateJsonPath(json, "data.access.token")).toBe("nested-value");
  });

  it("returns undefined for missing path", () => {
    const json = { token: "abc123" };
    expect(navigateJsonPath(json, "missing")).toBeUndefined();
  });

  it("returns undefined for missing nested path", () => {
    const json = { data: { token: "abc123" } };
    expect(navigateJsonPath(json, "data.missing.token")).toBeUndefined();
  });

  it("returns undefined for null value", () => {
    const json = { token: null };
    expect(navigateJsonPath(json, "token")).toBeUndefined();
  });

  it("returns undefined for undefined root", () => {
    expect(navigateJsonPath(undefined, "token")).toBeUndefined();
  });

  it("returns undefined for null root", () => {
    expect(navigateJsonPath(null, "token")).toBeUndefined();
  });

  it("stringifies a number value", () => {
    const json = { count: 42 };
    expect(navigateJsonPath(json, "count")).toBe("42");
  });

  it("stringifies a boolean value", () => {
    const json = { active: true };
    expect(navigateJsonPath(json, "active")).toBe("true");
  });

  it("JSON-stringifies an object value", () => {
    const json = { data: { nested: { key: "value" } } };
    const result = navigateJsonPath(json, "data.nested");
    expect(result).toBe('{"key":"value"}');
  });

  it("JSON-stringifies an array value", () => {
    const json = { items: [1, 2, 3] };
    expect(navigateJsonPath(json, "items")).toBe("[1,2,3]");
  });

  it("handles empty string path segment", () => {
    const json = { "": "empty-key" };
    expect(navigateJsonPath(json, "")).toBe("empty-key");
  });
});

describe("extractRegexCapture", () => {
  it("extracts first capture group", () => {
    const text = 'token: "abc123"';
    expect(extractRegexCapture(text, 'token: "([^"]+)"')).toBe("abc123");
  });

  it("returns undefined when no match", () => {
    const text = "no token here";
    expect(extractRegexCapture(text, "token: (.+)")).toBeUndefined();
  });

  it("returns undefined when no capture group", () => {
    const text = "token: abc123";
    expect(extractRegexCapture(text, "token: [a-z]+")).toBeUndefined();
  });

  it("extracts from multiline text", () => {
    const text = "line1\ntoken=secret123\nline3";
    expect(extractRegexCapture(text, "token=([a-z0-9]+)")).toBe("secret123");
  });

  it("extracts only the first capture group", () => {
    const text = "a=1 b=2";
    expect(extractRegexCapture(text, "a=(\\d+) b=(\\d+)")).toBe("1");
  });

  it("handles special regex characters in text", () => {
    const text = '{"token":"abc.def+ghi"}';
    expect(extractRegexCapture(text, '"token":"([^"]+)"')).toBe("abc.def+ghi");
  });
});
