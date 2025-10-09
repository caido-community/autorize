<script setup lang="ts">
import Card from "primevue/card";
import InputNumber from "primevue/inputnumber";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import { computed } from "vue";

import { MutationsManager } from "@/components/MutationsManager";
import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();
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
  get: () => configStore.data?.queue.requestsPerSecond ?? 1,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        queue: { ...configStore.data.queue, requestsPerSecond: value },
      });
    }
  },
});

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

const testNoAuth = computed({
  get: () => configStore.data?.testNoAuth ?? true,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({ testNoAuth: value });
    }
  },
});

const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);
</script>

<template>
  <div class="flex flex-col gap-1.5 h-full overflow-auto">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-full p-4' },
        content: { class: 'h-full flex flex-col overflow-auto' },
      }"
    >
      <template #content>
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold">Configuration</h2>
            <p class="text-sm text-gray-400">
              Configure how the plugin behaves to suit your needs
            </p>
          </div>
          <div v-if="isPluginEnabled" class="text-sm text-secondary-400">
            <i class="fas fa-lock mr-1" />
            Some parts of the configuration are read-only while monitoring is
            active.
          </div>
        </div>
      </template>
    </Card>

    <MutationsManager :disabled="isPluginEnabled" />

    <Card
      class="h-fit"
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
            <InputSwitch v-model="onlyInScope" :disabled="isPluginEnabled" />
          </div>

          <div class="flex flex-col gap-2">
            <div>
              <label class="text-sm font-medium">HTTPQL Filter</label>
              <p class="text-sm text-surface-400 mt-1">
                Filter passive scanning requests using HTTPQL query language
              </p>
            </div>
            <InputText
              v-model="httpqlFilter"
              placeholder='req.path.like:"/api/%"'
              :disabled="isPluginEnabled"
              class="w-full"
            />
          </div>
        </div>
      </template>
    </Card>

    <Card
      class="h-fit"
      :pt="{
        body: { class: 'p-4' },
        content: { class: 'flex flex-col' },
      }"
    >
      <template #content>
        <h3 class="text-md font-semibold mb-4">General Settings</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium">Test No Auth</label>
              <p class="text-sm text-surface-400 mt-1">
                Test requests without any authorization headers
              </p>
            </div>
            <InputSwitch v-model="testNoAuth" :disabled="isPluginEnabled" />
          </div>
        </div>
      </template>
    </Card>

    <Card
      class="h-fit"
      :pt="{
        body: { class: 'p-4' },
        content: { class: 'flex flex-col' },
      }"
    >
      <template #content>
        <h3 class="text-md font-semibold mb-4">Queue Settings</h3>
        <div class="space-y-4">
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
          <InputSwitch v-model="showOnlyLengths" />
        </div>
      </template>
    </Card>
  </div>
</template>
