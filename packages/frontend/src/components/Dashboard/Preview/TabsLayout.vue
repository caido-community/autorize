<script setup lang="ts">
import { computed } from "vue";

import { Editors } from "@/components/Dashboard/Preview/Editors";
import { ResultsBar } from "@/components/Dashboard/ResultsBar";
import { useTemplatesStore } from "@/stores/templates";

const templatesStore = useTemplatesStore();
const selectedRequestID = computed(() => templatesStore.selectedRequestID);
const selectedTemplate = computed(() => templatesStore.selectedTemplate);
</script>

<template>
  <ResultsBar v-if="selectedTemplate?.results.length ?? 0 > 0" />
  <div class="flex-1 min-h-0">
    <Editors :request-id="selectedRequestID" />
  </div>
</template>
