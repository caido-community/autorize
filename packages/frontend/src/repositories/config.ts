import type { Config } from "shared";

import { useSDK } from "@/plugins/sdk";

export const useConfigRepository = () => {
  const sdk = useSDK();

  const getConfig = async () => {
    const result = await sdk.backend.getConfig();
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
        config: result.value,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const updateConfig = async (updates: Partial<Config>) => {
    const result = await sdk.backend.updateConfig(updates);
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  return {
    getConfig,
    updateConfig,
  };
};
