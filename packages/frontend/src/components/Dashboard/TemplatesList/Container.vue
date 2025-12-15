<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Menu from "primevue/menu";
import { computed, ref } from "vue";

import { TemplatesTable } from "./Table";
import { useExport } from "./useExport";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const configStore = useConfigStore();
const { exportSelectedAsCSV, exportSelectedAsMarkdown } = useExport();

const hasTemplates = computed(() => store.data.length > 0);
const isPassiveEnabled = computed(() => configStore.data?.enabled ?? false);
const canShowBulkActions = computed(
  () => !isPassiveEnabled.value && store.hasSelection,
);

const isRescanningAll = ref(false);
const isStoppingQueue = ref(false);
const isDeletingSelected = ref(false);
const httpqlInput = ref("");

const exportMenu = ref();

const exportMenuItems = [
  {
    label: "As CSV",
    icon: "fas fa-file-csv",
    command: () => exportSelectedAsCSV(),
  },
  {
    label: "As Markdown",
    icon: "fa-brands fa-markdown",
    command: () => exportSelectedAsMarkdown(),
  },
];

const toggleExportMenu = (event: Event) => {
  exportMenu.value?.toggle(event);
};

const handleSearch = () => {
  store.filterByHttpql(httpqlInput.value);
};

const handleClearSearch = () => {
  httpqlInput.value = "";
  store.filterByHttpql("");
};

const handleClearAll = async () => {
  await store.clearAll();
};

const handleRescanAll = async () => {
  isRescanningAll.value = true;
  await store.rescanAll();
  isRescanningAll.value = false;
};

const handleStopQueue = async () => {
  isStoppingQueue.value = true;
  await store.stopQueue();
  isStoppingQueue.value = false;
};

const handleDeleteSelected = async () => {
  isDeletingSelected.value = true;
  await store.deleteSelected();
  isDeletingSelected.value = false;
};
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      root: { style: 'display: flex; flex-direction: column;' },
      body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
      content: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
    }"
  >
    <template #header>
      <div class="p-4 flex justify-between items-center">
        <div class="flex justify-between items-start gap-8">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold">Dashboard</h2>
            <p class="text-sm text-gray-400">
              Review and analyze requests processed by Autorize along with their
              test results.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="relative flex-1 min-w-[20em]">
            <InputText
              v-model="httpqlInput"
              placeholder='req.method.eq:"POST"'
              class="w-full font-mono text-sm"
              :disabled="!hasTemplates"
              @keyup.enter="handleSearch"
            />
            <i
              v-if="store.isFiltering"
              class="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm pointer-events-none"
            />
            <i
              v-else-if="httpqlInput !== ''"
              class="fas fa-times absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm cursor-pointer hover:text-surface-200"
              @click="handleClearSearch"
            />
          </div>

          <div
            v-if="canShowBulkActions"
            class="flex items-center gap-2 border-r border-surface-600 pr-2"
          >
            <Button
              v-tooltip.left="'Delete selected templates'"
              label="Delete"
              severity="danger"
              size="small"
              icon="fas fa-trash"
              outlined
              :loading="isDeletingSelected"
              @click="handleDeleteSelected"
            />
            <Button
              v-tooltip.left="'Export to file'"
              label="Export"
              severity="secondary"
              size="small"
              icon="fas fa-download"
              outlined
              @click="toggleExportMenu"
            />
            <Menu ref="exportMenu" :model="exportMenuItems" popup />
          </div>

          <Button
            v-tooltip.left="
              store.hasActiveJobs
                ? 'Stop processing queue and clear all pending requests'
                : 'No active jobs in queue'
            "
            label="Stop"
            severity="danger"
            size="small"
            icon="fas fa-stop"
            outlined
            :disabled="!store.hasActiveJobs"
            :loading="isStoppingQueue"
            @click="handleStopQueue"
          />
          <Button
            label="Rescan All"
            severity="info"
            size="small"
            icon="fas fa-redo"
            outlined
            :disabled="!hasTemplates || isStoppingQueue"
            :loading="isRescanningAll"
            @click="handleRescanAll"
          />
          <Button
            label="Clear All"
            severity="danger"
            size="small"
            icon="fas fa-trash-alt"
            outlined
            :disabled="!hasTemplates || isStoppingQueue"
            @click="handleClearAll"
          />
        </div>
      </div>
    </template>

    <template #content>
      <TemplatesTable />
    </template>
  </Card>
</template>
