<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { computed } from "vue";

import { useTemplateColumns } from "./useTemplateColumns";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const configStore = useConfigStore();
const {
  parseURL,
  getBaselineCode,
  getBaselineRespLen,
  codeAndLengthColumns,
  accessColumns,
} = useTemplateColumns();

const selectedTemplate = computed({
  get: () => store.selectedTemplate,
  set: (template) => store.select(template),
});

const handleDelete = async (event: Event, templateId: number) => {
  event.stopPropagation();
  await store.deleteTemplate(templateId);
};

const handleRerun = async (event: Event, templateId: number) => {
  event.stopPropagation();
  await store.rerun(templateId);
};

const handleClearAll = async () => {
  await store.clearAll();
};

const handleRescanAll = async () => {
  await store.rescanAll();
};

const handleView = (event: Event, templateId: number) => {
  event.stopPropagation();
  console.log(store.data.find((t) => t.id === templateId));
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
      <DataTable
        v-model:selection="selectedTemplate"
        :value="store.data"
        striped-rows
        selection-mode="single"
        size="small"
        scroll-height="flex"
        scrollable
        :pt="{
          root: { class: 'flex-1 min-h-0 min-w-[800px] overflow-auto' },
          table: { class: 'w-full table-fixed' },
        }"
      >
        <Column field="id" header="ID" style="width: 3%" />
        <Column header="Host" style="width: 12%">
          <template #body="{ data }">
            <div class="overflow-hidden text-ellipsis whitespace-nowrap">
              {{ parseURL(data.request.url).host }}
            </div>
          </template>
        </Column>
        <Column field="request.method" header="Method" style="width: 5%">
          <template #body="{ data }">
            <div class="overflow-hidden text-ellipsis whitespace-nowrap">
              {{ data.request.method }}
            </div>
          </template>
        </Column>
        <Column header="Path" style="width: 35%">
          <template #body="{ data }">
            <div class="overflow-hidden text-ellipsis whitespace-nowrap">
              {{ parseURL(data.request.url).pathWithQuery }}
            </div>
          </template>
        </Column>
        <Column
          v-if="!configStore.data?.ui?.showOnlyLengths"
          header="Orig. Resp. Code"
          style="width: 8%"
        >
          <template #body="{ data }">
            {{ getBaselineCode(data) ?? "-" }}
          </template>
        </Column>
        <Column header="Orig. Resp. Len" style="width: 9%">
          <template #body="{ data }">
            {{ getBaselineRespLen(data) ?? "-" }}
          </template>
        </Column>
        <Column
          v-for="column in codeAndLengthColumns"
          :key="column.field"
          :header="column.header"
          style="width: 9%"
        >
          <template #body="{ data }">
            {{ column.getter(data) ?? "-" }}
          </template>
        </Column>
        <Column
          v-for="column in accessColumns"
          :key="column.field"
          :header="column.header"
          style="width: 5%"
        >
          <template #body="{ data }">
            <div
              :style="{
                backgroundColor: column.colorGetter?.(data),
                padding: '0.25rem 0',
                borderRadius: '0.25rem',
                textAlign: 'center',
              }"
            >
              {{ column.getter(data) ?? "-" }}
            </div>
          </template>
        </Column>

        <Column header="" style="width: 8%">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="fas fa-redo"
                severity="secondary"
                text
                size="small"
                @click="handleRerun($event, data.id)"
              />
              <Button
                icon="fas fa-trash"
                severity="danger"
                text
                size="small"
                @click="handleDelete($event, data.id)"
              />
              <Button
                icon="fas fa-eye"
                severity="secondary"
                text
                size="small"
                @click="handleView($event, data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
