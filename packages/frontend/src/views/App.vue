<script setup lang="ts">
import MenuBar from "primevue/menubar";
import ToggleSwitch from "primevue/toggleswitch";
import Button from "primevue/button";
import { computed, onMounted, ref } from "vue";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";
import Configuration from "@/views/Configuration.vue";
import Dashboard from "@/views/Dashboard.vue";

const page = ref<"Dashboard" | "Configuration">("Dashboard");
const items = [
  {
    label: "Dashboard",
    command: () => {
      page.value = "Dashboard";
    },
  },
  {
    label: "Configuration",
    command: () => {
      page.value = "Configuration";
    },
  },
];

const component = computed(() => {
  switch (page.value) {
    case "Dashboard":
      return Dashboard;
    case "Configuration":
      return Configuration;
    default:
      return undefined;
  }
});

const configStore = useConfigStore();
const templatesStore = useTemplatesStore();

onMounted(() => {
  configStore.initialize();
  templatesStore.initialize();
});

const isEnabled = computed({
  get: () => configStore.data?.enabled ?? false,
  set: (value) => configStore.update({ enabled: value }),
});

const anyMutations = computed(
  () => configStore.data?.mutations.length ?? 0 > 0
);

// for some reason we can't just do :label="item.label"
const handleLabel = (
  label: string | ((...args: unknown[]) => string) | undefined
) => {
  if (typeof label === "function") {
    return label();
  }

  return label;
};
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <MenuBar :model="items" class="h-12 gap-2">
      <template #start>
        <div class="px-2 font-bold">Autorize</div>
      </template>

      <template #item="{ item }">
        <Button
          :severity="item.isActive?.() ? 'secondary' : 'contrast'"
          :outlined="item.isActive?.()"
          size="small"
          :text="!item.isActive?.()"
          :label="handleLabel(item.label)"
        />
      </template>

      <template #end>
        <div class="flex items-center gap-2 flex-shrink-0">
          <label for="autorize-toggle" class="text-sm text-gray-400">
            Enable Passive Scanning
          </label>
          <div
            v-if="!anyMutations"
            v-tooltip.left="
              'Enable only when you have at least one authorization mutation configured.'
            "
          >
            <ToggleSwitch
              v-model="isEnabled"
              input-id="autorize-toggle"
              :disabled="!anyMutations"
            />
          </div>
          <ToggleSwitch
            v-else
            v-model="isEnabled"
            input-id="autorize-toggle"
            :disabled="!anyMutations"
          />
        </div>
      </template>
    </MenuBar>
    <div class="flex-1 min-h-0">
      <component :is="component" />
    </div>
  </div>
</template>
