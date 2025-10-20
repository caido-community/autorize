<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { type MutationType } from "shared";
import { computed, ref, watch } from "vue";

import { useMutations } from "./useMutations";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();
const mutations = ref(configStore.data?.mutations ?? []);

const {
  selectedType,
  requestTypes,
  mutationTypes,
  newMutation,
  canAddMutation,
  addMutation,
  removeMutation,
  getMutationTypeLabel,
  getMutationField,
  getMutationValue,
  updateMutationField,
  updateMutationValue,
} = useMutations();

const handleAddMutation = () => {
  addMutation(mutations.value);
  configStore.update({ mutations: mutations.value });
};

const handleRemoveMutation = (index: number) => {
  removeMutation(mutations.value, index);
  configStore.update({ mutations: mutations.value });
};

const editingRows = ref<Set<number>>(new Set());

const toggleEdit = (index: number) => {
  const newEditingRows = new Set(editingRows.value);
  if (newEditingRows.has(index)) {
    newEditingRows.delete(index);
  } else {
    newEditingRows.add(index);
  }
  editingRows.value = newEditingRows;
};

const isEditing = (index: number) => {
  return editingRows.value.has(index);
};

const handleFieldUpdate = (index: number, value: string) => {
  const mutation = mutations.value[index];
  if (mutation !== undefined) {
    updateMutationField(mutation, value);
    configStore.update({ mutations: mutations.value });
  }
};

const handleValueUpdate = (index: number, value: string) => {
  const mutation = mutations.value[index];
  if (mutation !== undefined) {
    updateMutationValue(mutation, value);
    configStore.update({ mutations: mutations.value });
  }
};

watch(
  () => configStore.data?.mutations,
  (newMutations) => {
    if (newMutations) {
      mutations.value = [...newMutations];
    }
  },
);

watch(selectedType, (newType) => {
  newMutation.value.type = newType;
});

const filteredMutations = computed(() => {
  return mutations.value.filter((m) => m.type === selectedType.value);
});

const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

const getTypeDescription = (type: MutationType) => {
  const descriptions = {
    mutated:
      "Configure how to modify requests to simulate a low-privilege user.",
    "no-auth":
      "Configure how to modify requests to simulate an unauthenticated user (no authorization). Autorize already removes some headers by default.",
    baseline:
      "Configure how to modify the baseline (original) request. This will affect every request sent.",
  };
  return descriptions[type] ?? "";
};
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'p-4' },
      content: { class: 'flex flex-col' },
    }"
  >
    <template #content>
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">Request Mutations</h3>
          <p class="text-sm text-surface-400">
            {{ getTypeDescription(selectedType) }}
          </p>
        </div>
        <div class="w-48">
          <Select
            v-model="selectedType"
            :options="requestTypes"
            option-label="label"
            option-value="value"
            class="w-full"
          >
            <template #option="{ option }">
              <span v-tooltip.left="option.tooltip">{{ option.label }}</span>
            </template>
          </Select>
        </div>
      </div>

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
        <Column header="Field" style="width: 30%">
          <template #body="{ data, index }">
            <InputText
              v-if="isEditing(index)"
              :model-value="getMutationField(data)"
              autofocus
              fluid
              @blur="handleFieldUpdate(index, $event.target.value)"
              @keyup.enter="handleFieldUpdate(index, $event.target.value)"
            />
            <span
              v-else
              class="px-3 py-2 block text-ellipsis whitespace-nowrap overflow-hidden"
            >
              {{ getMutationField(data) }}
            </span>
          </template>
        </Column>
        <Column header="Value" style="width: 45%">
          <template #body="{ data, index }">
            <InputText
              v-if="isEditing(index) && data.kind !== 'HeaderRemove'"
              :model-value="getMutationValue(data)"
              autofocus
              fluid
              @blur="handleValueUpdate(index, $event.target.value)"
              @keyup.enter="handleValueUpdate(index, $event.target.value)"
            />
            <span
              v-else
              class="px-3 py-2 block text-ellipsis whitespace-nowrap overflow-hidden"
            >
              {{ getMutationValue(data) }}
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
              :disabled="isPluginEnabled"
              @click="toggleEdit(index)"
            />
            <Button
              icon="fas fa-trash"
              text
              severity="danger"
              size="small"
              :disabled="isPluginEnabled"
              @click="handleRemoveMutation(index)"
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

      <div class="border border-surface-700 rounded p-4 space-y-3 mt-4">
        <h4 class="text-sm font-semibold">Add Mutation</h4>
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-3">
            <Select
              v-model="newMutation.kind"
              :options="mutationTypes"
              option-label="label"
              option-value="value"
              class="w-full"
              placeholder="Type"
              :disabled="isPluginEnabled"
            >
              <template #option="{ option }">
                <span v-tooltip.top="option.tooltip">{{ option.label }}</span>
              </template>
            </Select>
          </div>
          <div class="col-span-4">
            <InputText
              v-if="newMutation.kind === 'RawMatchAndReplace'"
              v-model="newMutation.match"
              placeholder="Match pattern"
              class="w-full"
              :disabled="isPluginEnabled"
            />
            <InputText
              v-else
              v-model="newMutation.header"
              placeholder="Header name"
              class="w-full"
              :disabled="isPluginEnabled"
            />
          </div>
          <div class="col-span-4">
            <InputText
              v-model="newMutation.value"
              placeholder="Value"
              :disabled="isPluginEnabled || newMutation.kind === 'HeaderRemove'"
              class="w-full"
            />
          </div>
          <div class="col-span-1">
            <Button
              icon="fas fa-plus"
              :disabled="isPluginEnabled || !canAddMutation"
              class="w-full"
              @click="handleAddMutation"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
