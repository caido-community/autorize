<script setup lang="ts">
import { computed } from "vue";

import { Editors } from "@/components/Editors";
import { ResultsBar } from "@/components/ResultsBar";
import { TemplatesList } from "@/components/TemplatesList";
import { useTemplatesStore } from "@/stores/templates";

const templatesStore = useTemplatesStore();

const selectedTemplateID = computed(() => templatesStore.selectedID);
const selectedRequestID = computed(() => templatesStore.selectedRequestID);

const selectedTemplate = computed(() => templatesStore.selectedTemplate);
</script>

<template>
  <div class="h-full flex flex-col gap-1.5">
    <div :class="selectedTemplateID ? 'h-1/2' : 'h-full'">
      <TemplatesList />
    </div>
    <div v-if="selectedTemplateID" class="h-1/2 flex flex-col gap-1.5 min-h-0">
      <ResultsBar v-if="selectedTemplate?.results.length ?? 0 > 0" />
      <div class="flex-1 min-h-0">
        <Editors :request-id="selectedRequestID" />
      </div>
    </div>
  </div>
</template>
