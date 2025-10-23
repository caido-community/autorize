<script setup lang="ts">
import Card from "primevue/card";
import InputText from "primevue/inputtext";
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

const showFullURL = computed({
  get: () => configStore.data?.ui.showFullURL ?? true,
  set: (value) => {
    if (configStore.data !== undefined) {
      configStore.update({
        ui: { ...configStore.data.ui, showFullURL: value },
      });
    }
  },
});

const authorizedLabel = computed({
  get: () => configStore.data?.ui.accessStateLabels.authorized ?? "ALLOW",
  set: (value) => {
    if (
      configStore.data !== undefined &&
      value.length >= 1 &&
      value.length <= 14
    ) {
      configStore.update({
        ui: {
          ...configStore.data.ui,
          accessStateLabels: {
            ...configStore.data.ui.accessStateLabels,
            authorized: value,
          },
        },
      });
    }
  },
});

const unauthorizedLabel = computed({
  get: () => configStore.data?.ui.accessStateLabels.unauthorized ?? "DENY",
  set: (value) => {
    if (
      configStore.data !== undefined &&
      value.length >= 1 &&
      value.length <= 14
    ) {
      configStore.update({
        ui: {
          ...configStore.data.ui,
          accessStateLabels: {
            ...configStore.data.ui.accessStateLabels,
            unauthorized: value,
          },
        },
      });
    }
  },
});

const uncertainLabel = computed({
  get: () => configStore.data?.ui.accessStateLabels.uncertain ?? "UNCERTAIN",
  set: (value) => {
    if (
      configStore.data !== undefined &&
      value.length >= 1 &&
      value.length <= 14
    ) {
      configStore.update({
        ui: {
          ...configStore.data.ui,
          accessStateLabels: {
            ...configStore.data.ui.accessStateLabels,
            uncertain: value,
          },
        },
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
      <div class="space-y-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">UI Settings</h3>
          <p class="text-sm text-surface-400">
            Configure UI settings for the plugin
          </p>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">Show Only Lengths</label>
            <p class="text-sm text-surface-400">
              Display only response lengths in results table
            </p>
          </div>
          <ToggleSwitch v-model="showOnlyLengths" />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium">Show Full URL</label>
            <p class="text-sm text-surface-400">
              Display full URLs instead of just paths in results table
            </p>
          </div>
          <ToggleSwitch v-model="showFullURL" />
        </div>
        <div class="border-t border-surface-700 pt-4">
          <h4 class="text-sm font-semibold mb-1">Access State Labels</h4>
          <p class="text-sm text-surface-400 mb-4">
            Customize labels for access states (1-14 characters). In other
            tools, this is often set to "Enforced" and "Bypassed".
          </p>
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium block mb-1">Authorized</label>
                <p class="text-xs text-surface-400">
                  Status shown when server accepted the request
                </p>
              </div>
              <InputText
                v-model="authorizedLabel"
                class="w-32"
                :maxlength="14"
                placeholder="ALLOW"
              />
            </div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium block mb-1"
                  >Unauthorized</label
                >
                <p class="text-xs text-surface-400">
                  Status shown when server blocked the request
                </p>
              </div>
              <InputText
                v-model="unauthorizedLabel"
                class="w-32"
                :maxlength="14"
                placeholder="DENY"
              />
            </div>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium block mb-1">Uncertain</label>
                <p class="text-xs text-surface-400">
                  Status shown when access state cannot be determined
                </p>
              </div>
              <InputText
                v-model="uncertainLabel"
                class="w-32"
                :maxlength="14"
                placeholder="UNCERTAIN"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
