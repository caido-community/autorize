<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { ref, watch } from "vue";

import { useMutationsManager } from "./useMutationsManager";

import { useConfigStore } from "@/stores/config";

defineProps<{
  disabled?: boolean;
}>();

const configStore = useConfigStore();

const mutations = ref(configStore.data?.mutations ?? []);

const {
  mutationTypes,
  newMutation,
  canAddMutation,
  addMutation,
  removeMutation,
  getMutationTypeLabel,
  getMutationField,
  getMutationValue,
} = useMutationsManager();

const handleAddMutation = () => {
  addMutation(mutations.value);
  configStore.update({ mutations: mutations.value });
};

const handleRemoveMutation = (index: number) => {
  removeMutation(mutations.value, index);
  configStore.update({ mutations: mutations.value });
};

watch(
  () => configStore.data?.mutations,
  (newMutations) => {
    if (newMutations) {
      mutations.value = [...newMutations];
    }
  },
);
</script>

<template>
  <Card
    class="h-fit"
    :pt="{
      body: { class: 'p-4' },
      content: { class: 'flex flex-col' },
    }"
  >
    <template #content>
      <h3 class="text-md font-semibold mb-2">Request Mutation</h3>
      <p class="text-sm text-surface-400 mb-4">
        Configure how to modify requests to simulate a low-privilege user
      </p>

      <DataTable
        :value="mutations"
        striped-rows
        :pt="{
          root: { class: 'border border-surface-700 rounded' },
        }"
      >
        <Column field="kind" header="Type">
          <template #body="{ data }">
            {{ getMutationTypeLabel(data.kind) }}
          </template>
        </Column>
        <Column header="Field">
          <template #body="{ data }">
            {{ getMutationField(data) }}
          </template>
        </Column>
        <Column header="Value">
          <template #body="{ data }">
            {{ getMutationValue(data) }}
          </template>
        </Column>
        <Column header="Actions" style="width: 100px">
          <template #body="{ index }">
            <Button
              icon="fas fa-trash"
              text
              severity="danger"
              size="small"
              :disabled="disabled"
              @click="handleRemoveMutation(index)"
            />
          </template>
        </Column>
        <template #empty>
          <div class="text-center py-4 text-surface-400">
            No authorization modifications configured
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
              :disabled="disabled"
            />
          </div>
          <div class="col-span-4">
            <InputText
              v-if="newMutation.kind === 'RawMatchAndReplace'"
              v-model="newMutation.match"
              placeholder="Match pattern"
              class="w-full"
              :disabled="disabled"
            />
            <InputText
              v-else
              v-model="newMutation.header"
              placeholder="Header name"
              class="w-full"
              :disabled="disabled"
            />
          </div>
          <div class="col-span-4">
            <InputText
              v-model="newMutation.value"
              placeholder="Value"
              :disabled="disabled || newMutation.kind === 'HeaderRemove'"
              class="w-full"
            />
          </div>
          <div class="col-span-1">
            <Button
              icon="fas fa-plus"
              :disabled="disabled || !canAddMutation"
              class="w-full"
              @click="handleAddMutation"
            />
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
