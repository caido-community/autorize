<script setup lang="ts">
import Card from "primevue/card";
import ToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const showOnlyLengths = computed({
  get: () => configStore.data?.ui.showOnlyLengths ?? false,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        ui: { ...configStore.data.ui, showOnlyLengths: value },
      });
    }
  },
});
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'p-4' },
      content: { class: 'flex flex-col' },
    }"
  >
    <template #content>
      <h3 class="text-md font-semibold mb-4">UI Settings</h3>
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium">Show Only Lengths</label>
          <p class="text-sm text-surface-400 mt-1">
            Display only response lengths in results table
          </p>
        </div>
        <ToggleSwitch v-model="showOnlyLengths" />
      </div>
    </template>
  </Card>
</template>
