<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";

import { TemplatesTable } from "./Table";

import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();

const handleClearAll = async () => {
  await store.clearAll();
};

const handleRescanAll = async () => {
  await store.rescanAll();
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
            label="Rescan All"
            severity="info"
            size="small"
            icon="fas fa-redo"
            outlined
            @click="handleRescanAll"
          />
          <Button
            label="Clear All"
            severity="danger"
            size="small"
            icon="fas fa-trash-alt"
            outlined
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
