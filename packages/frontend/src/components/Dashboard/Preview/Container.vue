<script setup lang="ts">
import { computed } from "vue";

import None from "./None.vue";
import TabsLayout from "./TabsLayout.vue";
import VerticalLayout from "./VerticalLayout.vue";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const configStore = useConfigStore();

const layout = computed(() => configStore.data?.ui.editorsLayout ?? "tabs");
const templatesStore = useTemplatesStore();
const selectedTemplate = computed(() => templatesStore.selectedTemplate);
const hasResults = computed(
  () => selectedTemplate.value?.results.length ?? 0 > 0,
);
</script>

<template>
  <None v-if="!hasResults" />
  <VerticalLayout v-else-if="layout === 'vertical'" />
  <TabsLayout v-else-if="layout === 'tabs'" />
</template>
