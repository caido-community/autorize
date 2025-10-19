<script setup lang="ts">
import Card from "primevue/card";
import { computed } from "vue";

import Configuration from "@/components/Configuration/Container.vue";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0 flex flex-col' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="p-4">
            <h2 class="text-lg font-semibold">Configuration</h2>
            <p class="text-sm text-gray-400">
              Configure how the plugin behaves to suit your needs
            </p>
          </div>
          <div v-if="isPluginEnabled" class="text-sm text-secondary-400 px-4">
            <i class="fas fa-lock mr-1" />
            Some parts of the configuration are read-only while monitoring is
            active.
          </div>
        </div>
      </template>
    </Card>

    <Configuration />
  </div>
</template>
