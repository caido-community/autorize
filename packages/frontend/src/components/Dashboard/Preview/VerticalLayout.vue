<script setup lang="ts">
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { computed } from "vue";

import { Editors } from "@/components/Dashboard/Preview/Editors";
import { useTemplatesStore } from "@/stores/templates";

const templatesStore = useTemplatesStore();
const selectedTemplate = computed(() => templatesStore.selectedTemplate);
const orderedResults = computed(() => templatesStore.orderedResults);
const panelSize = computed(() => {
  const count = orderedResults.value.length;
  return count > 0 ? Math.floor(100 / count) : 100;
});
</script>

<template>
  <div class="flex-1 min-h-0 overflow-hidden">
    <Splitter :key="selectedTemplate?.id" class="h-full" layout="vertical">
      <SplitterPanel
        v-for="result in orderedResults"
        :key="result.kind === 'Ok' ? result.request.id : ''"
        :size="panelSize"
        :min-size="10"
        class="overflow-hidden"
      >
        <div class="h-full overflow-hidden flex flex-col">
          <div class="bg-surface-700 px-3 py-1 flex-shrink-0">
            <span class="text-sm font-medium text-surface-200">
              {{ result.kind === "Ok" ? result.type.toUpperCase() : "" }}
            </span>
          </div>
          <div class="flex-1 min-h-0 overflow-hidden">
            <Editors
              v-if="result.kind === 'Ok'"
              :request-id="result.request.id"
            />
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>
