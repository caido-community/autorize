import { describe, expect, it } from "vitest";

import { resolvePort } from "./connection";

describe("resolvePort", () => {
  it("defaults to 443 with TLS when no port is present", () => {
    expect(resolvePort("dummyjson.com", true)).toBe(443);
  });

  it("defaults to 80 without TLS when no port is present", () => {
    expect(resolvePort("dummyjson.com", false)).toBe(80);
  });

  it("uses an explicit port from the Host header", () => {
    expect(resolvePort("dummyjson.com:8443", true)).toBe(8443);
  });

  it("falls back to the default for an out-of-range port", () => {
    expect(resolvePort("dummyjson.com:99999", true)).toBe(443);
    expect(resolvePort("dummyjson.com:0", false)).toBe(80);
  });

  it("falls back to the default for a non-numeric port", () => {
    expect(resolvePort("dummyjson.com:abc", true)).toBe(443);
  });

  it("reads the port from a bracketed IPv6 host", () => {
    expect(resolvePort("[2001:db8::1]:8443", true)).toBe(8443);
  });

  it("defaults the port for a bracketed IPv6 host without one", () => {
    expect(resolvePort("[2001:db8::1]", true)).toBe(443);
  });

  it("defaults the port for an unbracketed IPv6 host", () => {
    expect(resolvePort("2001:db8::1", false)).toBe(80);
  });

  it("ignores surrounding whitespace", () => {
    expect(resolvePort("  dummyjson.com:8443  ", true)).toBe(8443);
  });
});
