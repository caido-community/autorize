<script setup lang="ts">
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const authorizedHttpql = computed({
  get: () => configStore.data?.statusDetection.authorizedHttpql ?? "",
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        statusDetection: {
          ...configStore.data.statusDetection,
          authorizedHttpql: value,
        },
      });
    }
  },
});

const unauthorizedHttpql = computed({
  get: () => configStore.data?.statusDetection.unauthorizedHttpql ?? "",
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        statusDetection: {
          ...configStore.data.statusDetection,
          unauthorizedHttpql: value,
        },
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
          <h3 class="text-md font-semibold">Status Detection</h3>
          <p class="text-sm text-surface-400">
            Configure custom HTTPQL queries to detect authorized and
            unauthorized responses
          </p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium block">
              Authorized Response Detection
            </label>
            <p class="text-sm text-surface-400 mb-2">
              HTTPQL query to identify when a request is authorized (access
              granted)
            </p>
            <InputText
              v-model="authorizedHttpql"
              placeholder='resp.code.eq:200 AND resp.raw.cont:"success"'
              :disabled="isPluginEnabled"
              class="w-full font-mono text-sm"
            />
            <p class="text-xs text-surface-500 mt-1">
              Example: <code class="text-xs">resp.code.eq:200</code> or
              <code class="text-xs">resp.raw.cont:"authenticated"</code>
            </p>
          </div>

          <div>
            <label class="text-sm font-medium block">
              Unauthorized Response Detection
            </label>
            <p class="text-sm text-surface-400 mb-2">
              HTTPQL query to identify when a request is unauthorized (access
              denied)
            </p>
            <InputText
              v-model="unauthorizedHttpql"
              placeholder="resp.code.eq:401 OR resp.code.eq:403"
              :disabled="isPluginEnabled"
              class="w-full font-mono text-sm"
            />
            <p class="text-xs text-surface-500 mt-1">
              Example:
              <code class="text-xs">resp.code.eq:401 OR resp.code.eq:403</code>
              or
              <code class="text-xs">resp.raw.cont:"unauthorized"</code>
            </p>
          </div>
        </div>

        <Message severity="warn" :closable="false">
          <div class="text-sm">
            <p class="font-medium mb-1">Important Notes</p>
            <ul class="list-disc list-inside space-y-1">
              <li>
                If both queries match, the unauthorized query takes precedence
              </li>
              <li>
                If neither query matches, the default detection logic will be
                used
              </li>
              <li>
                This is optional. If not configured, the default detection logic
                will be used
              </li>
            </ul>
          </div>
        </Message>
      </div>
    </template>
  </Card>
</template>
