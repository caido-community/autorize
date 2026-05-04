import { describe, expect, it } from "vitest";

import {
  generateId,
  hashString,
  stringSimilarity,
  Uint8ArrayToString,
} from "./utils";

describe("hashString", () => {
  it("returns a SHA256 hex digest", () => {
    const result = hashString("hello");
    expect(result).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("returns different hashes for different inputs", () => {
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("returns the same hash for the same input", () => {
    expect(hashString("test")).toBe(hashString("test"));
  });

  it("handles empty string", () => {
    const result = hashString("");
    expect(result).toHaveLength(64);
  });
});

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it("returns unique values", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("contains a timestamp prefix", () => {
    const before = Date.now();
    const id = generateId();
    const timestamp = Number.parseInt(id.split("-")[0]!, 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
  });
});

describe("Uint8ArrayToString", () => {
  it("converts a simple byte array to string", () => {
    const data = new Uint8Array([72, 101, 108, 108, 111]);
    expect(Uint8ArrayToString(data)).toBe("Hello");
  });

  it("handles empty array", () => {
    expect(Uint8ArrayToString(new Uint8Array([]))).toBe("");
  });

  it("handles data larger than chunk size", () => {
    const data = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      data[i] = 65;
    }
    const result = Uint8ArrayToString(data);
    expect(result).toHaveLength(512);
    expect(result).toBe("A".repeat(512));
  });
});

describe("stringSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(stringSimilarity("hello world", "hello world")).toBeCloseTo(1, 5);
  });

  it("returns 0 for completely different strings", () => {
    expect(stringSimilarity("abc", "xyz")).toBe(0);
  });

  it("returns 0 for strings shorter than substring length", () => {
    expect(stringSimilarity("a", "a")).toBe(0);
  });

  it("returns a value between 0 and 1 for partially similar strings", () => {
    const similarity = stringSimilarity("hello world", "hello earth");
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
  });

  it("is case insensitive by default", () => {
    expect(stringSimilarity("Hello", "hello")).toBeCloseTo(1, 5);
  });

  it("respects case sensitivity when enabled", () => {
    const insensitive = stringSimilarity("Hello", "hello", 2, false);
    const sensitive = stringSimilarity("Hello", "hello", 2, true);
    expect(insensitive).toBeGreaterThan(sensitive);
  });
});
