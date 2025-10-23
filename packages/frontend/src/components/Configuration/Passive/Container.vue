<script setup lang="ts">
import Card from "primevue/card";
import InputNumber from "primevue/inputnumber";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

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

const requestTimeoutSeconds = computed({
  get: () => configStore.data?.queue.requestTimeoutSeconds ?? 30,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        queue: { ...configStore.data.queue, requestTimeoutSeconds: value },
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
      <div class="space-y-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">Queue Settings</h3>
          <p class="text-sm text-surface-400">
            Configure request queue and rate limiting settings
          </p>
        </div>

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">Max Concurrent Requests</label>
            <p class="text-sm text-surface-400">
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
            <p class="text-sm text-surface-400">
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

        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <label class="text-sm font-medium">Request Timeout (seconds)</label>
            <p class="text-sm text-surface-400">
              Timeout for individual requests
            </p>
          </div>
          <div class="flex-shrink-0">
            <InputNumber
              v-model="requestTimeoutSeconds"
              :min="5"
              :max="300"
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
