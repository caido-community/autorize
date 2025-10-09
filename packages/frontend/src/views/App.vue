<script setup lang="ts">
import MenuBar from "primevue/menubar";
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
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <MenuBar breakpoint="320px">
      <template #start>
        <div class="flex">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="px-3 py-2 cursor-pointer text-gray-300 rounded transition-all duration-200 ease-in-out"
            :class="{
              'bg-zinc-800/40': page === item.label,
              'hover:bg-gray-800/10': page !== item.label,
            }"
            @click="item.command"
          >
            {{ item.label }}
          </div>
        </div>
      </template>
    </MenuBar>
    <div class="flex-1 min-h-0">
      <component :is="component" />
    </div>
  </div>
</template>
