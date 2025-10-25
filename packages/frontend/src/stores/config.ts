import { create } from "mutative";
import { defineStore } from "pinia";
import type { Config } from "shared";
import { ref } from "vue";

import { useSDK } from "../plugins/sdk";

export const useConfigStore = defineStore("config", () => {
  const sdk = useSDK();
  const data = ref<Config | undefined>();

  const initialize = async () => {
    await fetch();

    sdk.backend.onEvent("project:changed", async () => {
      await fetch();
    });
  };

  const fetch = async () => {
    const result = await sdk.backend.getConfig();
    switch (result.kind) {
      case "Ok":
        data.value = result.value;
        break;
      case "Error":
        console.error(result.error);
        sdk.window.showToast(
          "[Autorize] Failed to fetch config: " + result.error,
          {
            variant: "error",
          },
        );
        break;
    }
  };

  const update = async (updates: Partial<Config>) => {
    const result = await sdk.backend.updateConfig(updates);
    switch (result.kind) {
      case "Ok":
        if (data.value !== undefined) {
          data.value = create(data.value, (draft) => {
            Object.assign(draft, updates);
          });
        }
        return true;
      case "Error":
        console.error(result.error);
        sdk.window.showToast(
          "[Autorize] Failed to update config: " + result.error,
          {
            variant: "error",
          },
        );
        return false;
    }
  };

  return { data, fetch, update, initialize };
});
