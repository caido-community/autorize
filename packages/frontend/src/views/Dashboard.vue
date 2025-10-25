<script setup lang="ts">
import { computed } from "vue";

import { PreviewLayout } from "@/components/Dashboard/Preview";
import { TemplatesList } from "@/components/Dashboard/TemplatesList";
import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const templatesStore = useTemplatesStore();
const configStore = useConfigStore();

const selectedTemplateID = computed(() => templatesStore.selectedID);
const selectedTemplate = computed(() => templatesStore.selectedTemplate);
const layout = computed(() => configStore.data?.ui.editorsLayout ?? "tabs");

const topHeight = computed(() => {
  if (selectedTemplateID.value === undefined) return "h-full";
  return layout.value === "vertical" ? "h-1/3" : "h-1/2";
});

const bottomHeight = computed(() => {
  return layout.value === "vertical" ? "h-2/3" : "h-1/2";
});
</script>

<template>
  <div class="h-full flex flex-col gap-1.5">
    <div :class="topHeight">
      <TemplatesList />
    </div>
    <div
      v-if="selectedTemplate !== undefined"
      :class="bottomHeight"
      class="flex flex-col gap-1.5 min-h-0"
    >
      <PreviewLayout />
    </div>
  </div>
</template>
