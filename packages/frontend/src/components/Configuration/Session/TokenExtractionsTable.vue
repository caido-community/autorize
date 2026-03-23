<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import type { SessionManagement, TokenExtraction } from "shared";
import { computed, ref } from "vue";

import { useConfigStore } from "@/stores/config";

const { profileId, disabled } = defineProps<{
  profileId: string;
  disabled: boolean;
}>();

const configStore = useConfigStore();

const userProfiles = computed(() => configStore.data?.userProfiles ?? []);
const profile = computed(() =>
  userProfiles.value.find((p) => p.id === profileId),
);
const sessionConfig = computed(() => profile.value?.sessionManagement);
const extractions = computed(() => sessionConfig.value?.tokenExtractions ?? []);

const editingRows = ref<Set<number>>(new Set());

const toggleEdit = (index: number) => {
  const next = new Set(editingRows.value);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  editingRows.value = next;
};

const isEditing = (index: number) => editingRows.value.has(index);

const getExtractionField = (extraction: TokenExtraction): string => {
  switch (extraction.kind) {
    case "Header":
      return extraction.headerName;
    case "JsonBody":
      return extraction.jsonPath;
    case "Regex":
      return extraction.pattern;
  }
};

const updateExtractions = async (updated: TokenExtraction[]) => {
  if (sessionConfig.value === undefined) return;
  const updatedConfig: SessionManagement = {
    ...sessionConfig.value,
    tokenExtractions: updated,
  };

  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId ? { ...p, sessionManagement: updatedConfig } : p,
    ),
  });
};

const handleFieldUpdate = (index: number, value: string) => {
  const extraction = extractions.value[index];
  if (extraction === undefined) return;

  const updated = [...extractions.value];
  const current = { ...extraction };

  switch (current.kind) {
    case "Header":
      current.headerName = value;
      break;
    case "JsonBody":
      current.jsonPath = value;
      break;
    case "Regex":
      current.pattern = value;
      break;
  }

  updated[index] = current;
  updateExtractions(updated);
};

const handleEnvVarUpdate = (index: number, value: string) => {
  const extraction = extractions.value[index];
  if (extraction === undefined) return;

  const updated = [...extractions.value];
  updated[index] = { ...extraction, envVar: value };
  updateExtractions(updated);
};

const handleRemove = (index: number) => {
  updateExtractions(extractions.value.filter((_, i) => i !== index));
};
</script>

<template>
  <DataTable
    :value="extractions"
    striped-rows
    class="h-full"
    :pt="{
      root: { class: 'border border-surface-700 rounded' },
      table: { class: 'w-full table-fixed' },
    }"
  >
    <Column field="kind" header="Type" style="width: 15%">
      <template #body="{ data }">
        {{ data.kind }}
      </template>
    </Column>
    <Column header="Field" style="width: 30%">
      <template #body="{ data, index }">
        <InputText
          v-if="isEditing(index)"
          :model-value="getExtractionField(data)"
          autofocus
          fluid
          @blur="handleFieldUpdate(index, $event.target.value)"
          @keyup.enter="handleFieldUpdate(index, $event.target.value)"
        />
        <span
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          {{ getExtractionField(data) }}
        </span>
      </template>
    </Column>
    <Column header="Env Variable" style="width: 30%">
      <template #body="{ data, index }">
        <InputText
          v-if="isEditing(index)"
          :model-value="data.envVar"
          fluid
          @blur="handleEnvVarUpdate(index, $event.target.value)"
          @keyup.enter="handleEnvVarUpdate(index, $event.target.value)"
        />
        <span
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          {{ data.envVar }}
        </span>
      </template>
    </Column>
    <Column header="Actions" style="width: 10%">
      <template #body="{ index }">
        <Button
          :icon="isEditing(index) ? 'fas fa-check' : 'fas fa-pencil'"
          text
          :severity="isEditing(index) ? 'success' : 'info'"
          size="small"
          :disabled="disabled"
          @click="toggleEdit(index)"
        />
        <Button
          icon="fas fa-trash"
          text
          severity="danger"
          size="small"
          :disabled="disabled"
          @click="handleRemove(index)"
        />
      </template>
    </Column>
    <template #empty>
      <div class="text-center py-4 text-surface-400">
        No extraction rules configured. Add one below.
      </div>
    </template>
  </DataTable>
</template>
