import type { UserProfile } from "shared";

export function createDefaultProfile(
  mutations: UserProfile["mutations"] = [],
): UserProfile {
  return {
    id: crypto.randomUUID(),
    name: "Mutated",
    enabled: true,
    mutations,
  };
}
