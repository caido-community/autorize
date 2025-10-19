<script setup lang="ts">
import Card from "primevue/card";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import ToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

import { useFilters } from "./useFilters";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();
const { allFilters, selectedFilterIds } = useFilters();

const onlyInScope = computed({
  get: () => configStore.data?.passiveFiltering.onlyInScope ?? false,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        passiveFiltering: {
          ...configStore.data.passiveFiltering,
          onlyInScope: value,
        },
      });
    }
  },
});

const httpqlFilter = computed({
  get: () => configStore.data?.passiveFiltering.httpql ?? "",
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        passiveFiltering: {
          ...configStore.data.passiveFiltering,
          httpql: value,
        },
      });
    }
  },
});

const maxConcurrentRequests = computed({
  get: () => configStore.data?.queue.maxConcurrentRequests ?? 2,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        queue: { ...configStore.data.queue, maxConcurrentRequests: value },
      });
    }
  },
});

const requestsPerSecond = computed({
  get: () => configStore.data?.queue.requestsPerSecond ?? 6,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        queue: { ...configStore.data.queue, requestsPerSecond: value },
      });
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
      <h3 class="text-md font-semibold mb-4">Passive Scanning</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">Only In Scope</label>
            <p class="text-sm text-surface-400 mt-1">
              Process only requests that are in scope
            </p>
          </div>
          <ToggleSwitch v-model="onlyInScope" :disabled="isPluginEnabled" />
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">Filters</label>
            <p class="text-sm text-surface-400 mt-1">
              Apply HTTPQL filter presets to passive scanning requests
            </p>
          </div>
          <div class="flex-shrink-0 w-64">
            <MultiSelect
              v-model="selectedFilterIds"
              :options="allFilters"
              option-label="name"
              option-value="id"
              placeholder="Select filters"
              :disabled="isPluginEnabled"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">HTTPQL Filter</label>
            <p class="text-sm text-surface-400 mt-1">
              Filter passive scanning requests using HTTPQL query language
            </p>
          </div>
          <div class="flex-shrink-0 w-64">
            <InputText
              v-model="httpqlFilter"
              placeholder='req.path.like:"/api/%"'
              :disabled="isPluginEnabled"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">Max Concurrent Requests</label>
            <p class="text-sm text-surface-400 mt-1">
              Maximum number of concurrent requests
            </p>
          </div>
          <div class="flex-shrink-0">
            <InputNumber
              v-model="maxConcurrentRequests"
              :min="1"
              :max="10"
              show-buttons
              :disabled="isPluginEnabled"
              :pt="{ root: { style: 'width: 100%;' } }"
            />
          </div>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">Requests Per Second</label>
            <p class="text-sm text-surface-400 mt-1">
              Rate limit for sending requests
            </p>
          </div>
          <div class="flex-shrink-0">
            <InputNumber
              v-model="requestsPerSecond"
              :min="1"
              :max="100"
              show-buttons
              :disabled="isPluginEnabled"
              :pt="{ root: { style: 'width: 100%;' } }"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
