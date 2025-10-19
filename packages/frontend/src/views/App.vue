<script setup lang="ts">
import MenuBar from "primevue/menubar";
import ToggleSwitch from "primevue/toggleswitch";
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
  () => configStore.data?.mutations.length ?? 0 > 0,
);
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <MenuBar breakpoint="320px">
      <template #start>
        <div class="flex">
          <div class="px-3 py-2 font-bold text-gray-300">Autorize</div>
          <div
            v-for="(item, index) in items"
            :key="index"
            class="px-3 py-2 cursor-pointer text-gray-300 rounded transition-all duration-200 ease-in-out"
            :class="{
              'bg-zinc-800/40': page === item.label,
              'hover:bg-gray-800/10': page !== item.label,
            }"
            @mousedown="item.command"
          >
            {{ item.label }}
          </div>
        </div>
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
