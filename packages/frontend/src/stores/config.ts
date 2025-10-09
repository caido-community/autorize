import { create } from "mutative";
import { defineStore } from "pinia";
import type { Config } from "shared";
import { ref } from "vue";

import { useSDK } from "../plugins/sdk";
import { useConfigRepository } from "../repositories/config";

export const useConfigStore = defineStore("config", () => {
  const sdk = useSDK();
  const repository = useConfigRepository();
  const data = ref<Config | undefined>();

  const initialize = async () => {
    await fetch();
  };

  const fetch = async () => {
    const result = await repository.getConfig();
    switch (result.type) {
      case "Ok":
        data.value = result.config;
        break;
      case "Err":
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
    const result = await repository.updateConfig(updates);
    switch (result.type) {
      case "Ok":
        if (data.value !== undefined) {
          data.value = create(data.value, (draft) => {
            Object.assign(draft, updates);
          });
        }
        return true;
      case "Err":
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
