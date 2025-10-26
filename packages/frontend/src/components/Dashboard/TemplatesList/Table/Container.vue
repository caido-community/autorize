<script setup lang="ts">
import type { Template } from "shared";
import { computed, ref } from "vue";
import { DynamicScroller } from "vue-virtual-scroller";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

import { RowContextMenu } from "../ContextMenu";

import { useTable } from "./useTable";

import { useConfigStore } from "@/stores/config";
import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const configStore = useConfigStore();

const {
  parseURL,
  getBaselineCode,
  getBaselineRespLen,
  getStatusCodeColor,
  codeAndLengthColumns,
  accessColumns,
  sortColumn,
  sortDirection,
  toggleSort,
  sortData,
} = useTable();

const contextMenu = ref<InstanceType<typeof RowContextMenu>>();

const selectedTemplate = computed({
  get: () => store.selectedTemplate,
  set: (template) => store.select(template),
});

const sortedData = computed(() => sortData(store.data));

const onRowClick = (event: MouseEvent, template: Template) => {
  if (event.button !== 0) {
    return;
  }

  if (selectedTemplate.value?.id === template.id) {
    selectedTemplate.value = undefined;
  } else {
    selectedTemplate.value = template;
  }
};

const onRowContextMenu = (event: MouseEvent, template: Template) => {
  event.preventDefault();
  contextMenu.value?.show(event, template);
};

const getSortIcon = (columnId: string) => {
  if (sortColumn.value !== columnId) return "fas fa-sort";
  if (sortDirection.value === "asc") return "fas fa-sort-up";
  return "fas fa-sort-down";
};

const columnWidths = {
  id: "3%",
  method: "5%",
  host: "8%",
  path: "29%",
  code: "8%",
  length: "7%",
  dynamic: "8%",
} as const;
</script>

<template>
  <div class="flex flex-col grow min-h-0 min-w-[800px]">
    <div class="pr-[12px]">
      <table class="w-full border-spacing-0 border-separate table-fixed">
        <thead class="bg-surface-900">
          <tr class="bg-surface-800/50 text-surface-0/50">
            <th
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.id }"
              @click="toggleSort('id')"
            >
              <span class="flex items-center gap-2">
                ID
                <i :class="getSortIcon('id')" class="text-xs" />
              </span>
            </th>
            <th
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.method }"
              @click="toggleSort('method')"
            >
              <span class="flex items-center gap-2">
                Method
                <i :class="getSortIcon('method')" class="text-xs" />
              </span>
            </th>
            <th
              v-if="configStore.data?.ui?.showFullURL"
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.host }"
              @click="toggleSort('host')"
            >
              <span class="flex items-center gap-2">
                Host
                <i :class="getSortIcon('host')" class="text-xs" />
              </span>
            </th>
            <th
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.path }"
              @click="toggleSort('path')"
            >
              <span class="flex items-center gap-2">
                Path
                <i :class="getSortIcon('path')" class="text-xs" />
              </span>
            </th>
            <th
              v-if="!configStore.data?.ui?.showOnlyLengths"
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.code }"
              @click="toggleSort('baselineCode')"
            >
              <span class="flex items-center gap-2">
                Orig. Code
                <i :class="getSortIcon('baselineCode')" class="text-xs" />
              </span>
            </th>
            <th
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.length }"
              @click="toggleSort('baselineLength')"
            >
              <span class="flex items-center gap-2">
                Orig. Len
                <i :class="getSortIcon('baselineLength')" class="text-xs" />
              </span>
            </th>
            <th
              v-for="column in codeAndLengthColumns"
              :key="column.field"
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2 cursor-pointer hover:bg-surface-700/50"
              :style="{ width: columnWidths.dynamic }"
              @click="toggleSort(column.field)"
            >
              <span class="flex items-center gap-2">
                {{ column.header }}
                <i :class="getSortIcon(column.field)" class="text-xs" />
              </span>
            </th>
            <th
              v-for="column in accessColumns"
              :key="column.field"
              class="font-semibold dark:font-normal leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-y-2 border-x-0 border-solid border-surface-900 py-[0.375rem] px-2"
              :style="{ width: columnWidths.dynamic }"
            >
              {{ column.header }}
            </th>
          </tr>
        </thead>
      </table>
    </div>
    <DynamicScroller
      :key="store.projectID"
      class="flex-1 overflow-auto bg-surface-800"
      :items="sortedData"
      :min-item-size="30"
      key-field="id"
    >
      <template #default="{ item, index }">
        <table
          class="w-full border-spacing-0 border-separate table-fixed h-[30px]"
        >
          <tbody class="bg-surface-800">
            <tr
              :class="[
                'cursor-pointer text-white/80',
                {
                  'bg-highlight': selectedTemplate?.id === item.id,
                  'bg-surface-800':
                    index % 2 === 0 && selectedTemplate?.id !== item.id,
                  'bg-surface-900':
                    index % 2 === 1 && selectedTemplate?.id !== item.id,
                  'hover:bg-surface-700/50': selectedTemplate?.id !== item.id,
                },
              ]"
              @mousedown="onRowClick($event, item)"
              @contextmenu="onRowContextMenu($event, item)"
            >
              <td
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{ width: columnWidths.id }"
              >
                {{ item.id }}
              </td>
              <td
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{ width: columnWidths.method }"
              >
                {{ item.request.method }}
              </td>
              <td
                v-if="configStore.data?.ui?.showFullURL"
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{ width: columnWidths.host }"
              >
                {{ parseURL(item.request.url).host }}
              </td>
              <td
                v-tooltip.top="{
                  value: parseURL(item.request.url).pathWithQuery,
                  showDelay: 500,
                }"
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{ width: columnWidths.path }"
              >
                {{ parseURL(item.request.url).pathWithQuery }}
              </td>
              <td
                v-if="!configStore.data?.ui?.showOnlyLengths"
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{
                  color: getStatusCodeColor(getBaselineCode(item)),
                  width: columnWidths.code,
                }"
              >
                {{ getBaselineCode(item) ?? "-" }}
              </td>
              <td
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{ width: columnWidths.length }"
              >
                {{ getBaselineRespLen(item) ?? "-" }}
              </td>
              <td
                v-for="column in codeAndLengthColumns"
                :key="column.field"
                class="leading-[normal] overflow-hidden text-ellipsis whitespace-nowrap text-left border-0 py-[0.375rem] px-2"
                :style="{
                  color: column.colorGetter?.(item),
                  width: columnWidths.dynamic,
                }"
              >
                {{ column.getter(item) ?? "-" }}
              </td>
              <td
                v-for="column in accessColumns"
                :key="column.field"
                class="leading-[normal] text-ellipsis whitespace-nowrap border-0 h-full"
                :style="{
                  backgroundColor: column.colorGetter?.(item),
                  padding: '0.25rem 0',
                  textAlign: 'center',
                  width: columnWidths.dynamic,
                }"
              >
                {{ column.getter(item) ?? "" }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DynamicScroller>
  </div>
  <RowContextMenu ref="contextMenu" />
</template>
