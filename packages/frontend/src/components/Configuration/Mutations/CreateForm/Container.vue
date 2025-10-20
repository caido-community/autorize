<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { MutationType } from "shared";

import { useCreateForm } from "./useCreateForm";

const props = defineProps<{
  selectedType: MutationType;
}>();

const mutationTypes = [
  {
    label: "Add Header",
    value: "HeaderAdd",
    tooltip: "Add a header to the request",
  },
  {
    label: "Remove Header",
    value: "HeaderRemove",
    tooltip: "Remove a header from the request",
  },
  {
    label: "Replace Header",
    value: "HeaderReplace",
    tooltip: "Replace a header in the request",
  },
  {
    label: "Match and Replace",
    value: "RawMatchAndReplace",
    tooltip: "Match a pattern in the request and replace it with a value",
  },
] as const;

const { newMutation, canAddMutation, handleAdd, isPluginEnabled } =
  useCreateForm(props.selectedType);
</script>

<template>
  <div class="border border-surface-700 rounded p-4 space-y-3">
    <div class="flex justify-between items-start">
      <h4 class="text-sm font-semibold">Add Mutation</h4>
      <span class="text-xs text-surface-400">
        <i class="fas fa-info-circle mr-1"></i>
        <span>Use </span>
        <code class="px-1 py-0.5 bg-surface-900 rounded text-xs">
          {{ "\{\{" }} ENV_VAR {{ "\}\}" }}
        </code>
        <span> for env variables</span>
      </span>
    </div>
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
          @click="handleAdd"
        />
      </div>
    </div>
  </div>
</template>
