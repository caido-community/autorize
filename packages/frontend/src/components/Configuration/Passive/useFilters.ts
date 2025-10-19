import { computed } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useConfigStore } from "@/stores/config";

export const useFilters = () => {
  const sdk = useSDK();
  const configStore = useConfigStore();

  const allFilters = computed(() => {
    return sdk.filters.getAll().map((filter) => ({
      id: filter.id,
      name: filter.name,
      alias: filter.alias,
      query: filter.query,
    }));
  });

  const selectedFilterIds = computed({
    get: () => configStore.data?.passiveFiltering.filters ?? [],
    set: (value) => {
      if (configStore.data !== undefined) {
        configStore.update({
          passiveFiltering: {
            ...configStore.data.passiveFiltering,
            filters: value,
          },
        });
      }
    },
  });

  return {
    allFilters,
    selectedFilterIds,
  };
};
