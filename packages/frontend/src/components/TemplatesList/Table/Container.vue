<script setup lang="ts">
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import type { DataTableRowContextMenuEvent } from "primevue/datatable";
import type { Template } from "shared";
import { computed, ref } from "vue";

import { RowContextMenu } from "../ContextMenu";

import { useTable } from "./useTable";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const configStore = useConfigStore();

const {
  isOnAutorizePage,
  parseURL,
  getBaselineCode,
  getBaselineRespLen,
  codeAndLengthColumns,
  accessColumns,
} = useTable();

const contextMenu = ref<InstanceType<typeof RowContextMenu>>();

const selectedTemplate = computed({
  get: () => store.selectedTemplate,
  set: (template) => store.select(template),
});

const onRowContextMenu = (event: DataTableRowContextMenuEvent) => {
  const template = event.data as Template;
  contextMenu.value?.show(event.originalEvent as MouseEvent, template);
};
</script>

<template>
  <!-- isOnAutorizePage makes sure that performance is not affected when not on the Autorize page -->
  <DataTable
    v-if="isOnAutorizePage"
    v-model:selection="selectedTemplate"
    :value="store.data"
    striped-rows
    selection-mode="single"
    size="small"
    scroll-height="flex"
    scrollable
    context-menu
    :pt="{
      root: {
        class:
          'relative flex flex-col grow min-h-0 min-w-[800px] overflow-auto',
      },
      table: { class: 'w-full border-spacing-0 border-separate table-fixed' },
    }"
    @row-contextmenu="onRowContextMenu"
  >
    <Column
      field="id"
      header="ID"
      style="width: 3%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    />
    <Column
      field="request.method"
      header="Method"
      style="width: 5%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ data.request.method }}
        </div>
      </template>
    </Column>
    <Column
      header="Host"
      style="width: 14%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ parseURL(data.request.url).host }}
        </div>
      </template>
    </Column>
    <Column
      header="Path"
      style="width: 23%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ parseURL(data.request.url).pathWithQuery }}
        </div>
      </template>
    </Column>
    <Column
      v-if="!configStore.data?.ui?.showOnlyLengths"
      header="Orig. Code"
      style="width: 8%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ getBaselineCode(data) ?? "-" }}
        </div>
      </template>
    </Column>
    <Column
      header="Orig. Len"
      style="width: 6%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ getBaselineRespLen(data) ?? "-" }}
        </div>
      </template>
    </Column>
    <Column
      v-for="column in codeAndLengthColumns"
      :key="column.field"
      :header="column.header"
      style="width: 6%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {{ column.getter(data) ?? "-" }}
        </div>
      </template>
    </Column>
    <Column
      v-for="column in accessColumns"
      :key="column.field"
      :header="column.header"
      style="width: 6%"
      :pt="{
        headerCell: {
          class: 'overflow-hidden text-ellipsis whitespace-nowrap',
        },
      }"
    >
      <template #body="{ data }">
        <div
          class="text-ellipsis whitespace-nowrap"
          :style="{
            backgroundColor: column.colorGetter?.(data),
            padding: '0.25rem 0',
            textAlign: 'center',
          }"
        >
          {{ column.getter(data) ?? "-" }}
        </div>
      </template>
    </Column>
  </DataTable>
  <RowContextMenu ref="contextMenu" />
</template>
