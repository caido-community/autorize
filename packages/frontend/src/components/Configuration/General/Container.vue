<script setup lang="ts">
import Card from "primevue/card";
import ToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const testNoAuth = computed({
  get: () => configStore.data?.testNoAuth ?? true,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({ testNoAuth: value });
    }
  },
});

const debugMode = computed({
  get: () => configStore.data?.debug ?? false,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({ debug: value });
    }
  },
});

const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);
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
      <div class="space-y-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">General Settings</h3>
          <p class="text-sm text-surface-400">
            Configure general settings for the plugin
          </p>
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">Test No Auth</label>
            <p class="text-sm text-surface-400 mt-1">
              Test requests without any authorization headers
            </p>
          </div>
          <ToggleSwitch v-model="testNoAuth" :disabled="isPluginEnabled" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">Debug Mode</label>
            <p class="text-sm text-surface-400 mt-1">Enable detailed logging</p>
          </div>
          <ToggleSwitch v-model="debugMode" />
        </div>
      </div>
    </template>
  </Card>
</template>
