import { createHash } from "crypto";

import { configStore } from "./stores/config";

export function hashString(str: string): string {
  return createHash("sha256").update(str).digest("hex");
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function debugLog(message: string, ...args: unknown[]): void {
  const config = configStore.getConfig();
  if (config.debug) {
    console.log(`[Autorize Debug] ${message}`, ...args);
  }
}

export function Uint8ArrayToString(data: Uint8Array): string {
  let output = "";
  const chunkSize = 256;
  for (let i = 0; i < data.length; i += chunkSize) {
    output += String.fromCharCode(...data.subarray(i, i + chunkSize));
  }
  return output;
}

/*
  Get the similarity between two strings
  https://github.com/stephenjjbrown/string-similarity-js/blob/master/src/string-similarity.ts
*/
export const stringSimilarity = (
  str1: string,
  str2: string,
  substringLength: number = 2,
  caseSensitive: boolean = false,
) => {
  if (!caseSensitive) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
  }

  if (str1.length < substringLength || str2.length < substringLength) return 0;

  const map = new Map();
  for (let i = 0; i < str1.length - (substringLength - 1); i++) {
    const substr1 = str1.substr(i, substringLength);
    map.set(substr1, map.has(substr1) ? map.get(substr1) + 1 : 1);
  }

  let match = 0;
  for (let j = 0; j < str2.length - (substringLength - 1); j++) {
    const substr2 = str2.substr(j, substringLength);
    const count = map.has(substr2) ? map.get(substr2) : 0;
    if (count > 0) {
      map.set(substr2, count - 1);
      match++;
    }
  }

  return (match * 2) / (str1.length + str2.length - (substringLength - 1) * 2);
};
