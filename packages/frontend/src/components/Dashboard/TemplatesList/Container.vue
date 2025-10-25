<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import { computed, ref } from "vue";

import { TemplatesTable } from "./Table";

import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const hasTemplates = computed(() => store.data.length > 0);

const isRescanningAll = ref(false);
const isStoppingQueue = ref(false);

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
          <Button
            v-if="store.hasActiveJobs"
            v-tooltip.left="
              'Stop processing queue and clear all pending requests'
            "
            label="Stop"
            severity="danger"
            size="small"
            icon="fas fa-stop"
            outlined
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
