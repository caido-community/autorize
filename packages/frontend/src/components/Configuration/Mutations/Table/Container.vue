<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import type { MutationType } from "shared";
import { computed } from "vue";

import HighlightedValue from "./HighlightedValue.vue";
import { useMutationsTable } from "./useMutationsTable";

const props = defineProps<{
  selectedType: MutationType;
  requestTypes: ReadonlyArray<{ label: string; value: string }>;
}>();

const {
  mutations,
  isPluginEnabled,
  toggleEdit,
  isEditing,
  handleFieldUpdate,
  handleValueUpdate,
  handleRegexUpdate,
  handleRemove,
  getMutationField,
  getMutationValue,
} = useMutationsTable();

const mutationTypes = [
  { label: "Add Header", value: "HeaderAdd" },
  { label: "Remove Header", value: "HeaderRemove" },
  { label: "Replace Header", value: "HeaderReplace" },
  { label: "Match and Replace", value: "RawMatchAndReplace" },
] as const;

const getMutationTypeLabel = (kind: string) => {
  const type = mutationTypes.find((t) => t.value === kind);
  return type?.label ?? kind;
};

const filteredMutations = computed(() => {
  return mutations.value.filter((m) => m.type === props.selectedType);
});
</script>

<template>
  <DataTable
    :value="filteredMutations"
    striped-rows
    class="h-full"
    :pt="{
      root: { class: 'border border-surface-700 rounded' },
      table: { class: 'w-full table-fixed' },
    }"
  >
    <Column field="kind" header="Type" style="width: 15%">
      <template #body="{ data }">
        {{ getMutationTypeLabel(data.kind) }}
      </template>
    </Column>
    <Column style="width: 28%">
      <template #header>
        <span
          v-tooltip.top="
            'Header name or match pattern (supports {{ VAR_NAME }} for Match and Replace)'
          "
        >
          Field
        </span>
      </template>
      <template #body="{ data, index }">
        <InputText
          v-if="isEditing(index)"
          :model-value="getMutationField(data)"
          autofocus
          fluid
          @blur="handleFieldUpdate(index, $event.target.value)"
          @keyup.enter="handleFieldUpdate(index, $event.target.value)"
        />
        <div
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          <HighlightedValue :value="getMutationField(data)" />
        </div>
      </template>
    </Column>
    <Column style="width: 40%">
      <template #header>
        <span
          v-tooltip.top="'Supports {{ VAR_NAME }} for environment variables'"
        >
          Value
        </span>
      </template>
      <template #body="{ data, index }">
        <InputText
          v-if="isEditing(index) && data.kind !== 'HeaderRemove'"
          :model-value="getMutationValue(data)"
          autofocus
          fluid
          @blur="handleValueUpdate(index, $event.target.value)"
          @keyup.enter="handleValueUpdate(index, $event.target.value)"
        />
        <div
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          <HighlightedValue :value="getMutationValue(data)" />
        </div>
      </template>
    </Column>
    <Column style="width: 7%">
      <template #header>
        <span v-tooltip.top="'Use regex for pattern matching'"> Regex </span>
      </template>
      <template #body="{ data, index }">
        <Checkbox
          v-if="data.kind === 'RawMatchAndReplace'"
          :model-value="data.regex"
          :disabled="isPluginEnabled"
          binary
          @update:model-value="handleRegexUpdate(index, $event)"
        />
      </template>
    </Column>
    <Column header="Actions" style="width: 10%">
      <template #body="{ index }">
        <Button
          :icon="isEditing(index) ? 'fas fa-check' : 'fas fa-pencil'"
          text
          :severity="isEditing(index) ? 'success' : 'info'"
          size="small"
          :disabled="isPluginEnabled"
          @click="toggleEdit(index)"
        />
        <Button
          icon="fas fa-trash"
          text
          severity="danger"
          size="small"
          :disabled="isPluginEnabled"
          @click="handleRemove(index)"
        />
      </template>
    </Column>
    <template #empty>
      <div class="text-center py-4 text-surface-400">
        No mutations configured for
        {{
          requestTypes.find((t) => t.value === selectedType)?.label ??
          selectedType
        }}
        requests
      </div>
    </template>
  </DataTable>
</template>
