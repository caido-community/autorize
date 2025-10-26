<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { MutationType } from "shared";
import { toRef } from "vue";

import { useCreateForm } from "./useCreateForm";

const props = defineProps<{
  selectedType: MutationType;
}>();

const mutationTypes = [
  {
    label: "Replace Header",
    value: "HeaderReplace",
    tooltip:
      "Replace a header in the request. If header does not exist, it will be added.",
  },
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
    label: "Match and Replace",
    value: "RawMatchAndReplace",
    tooltip: "Match a pattern in the request and replace it with a value",
  },
] as const;

const selectedType = toRef(props, "selectedType");
const { newMutation, canAddMutation, handleAdd, isPluginEnabled } =
  useCreateForm(selectedType);
</script>

<template>
  <div class="border border-surface-700 rounded p-4 space-y-3">
    <div class="flex justify-between items-start">
      <h4 class="text-sm font-semibold">Add Mutation</h4>
    </div>
    <div class="flex gap-3 items-center">
      <Select
        v-model="newMutation.kind"
        :options="mutationTypes"
        option-label="label"
        option-value="value"
        class="w-48"
        placeholder="Type"
        :disabled="isPluginEnabled"
      >
        <template #option="{ option }">
          <span v-tooltip.top="option.tooltip">{{ option.label }}</span>
        </template>
      </Select>
      <InputText
        v-if="newMutation.kind === 'RawMatchAndReplace'"
        v-model="newMutation.match"
        placeholder="Match pattern"
        class="flex-1"
        :disabled="isPluginEnabled"
      />
      <InputText
        v-else
        v-model="newMutation.header"
        placeholder="Header name"
        class="flex-1"
        :disabled="isPluginEnabled"
      />
      <InputText
        v-model="newMutation.value"
        placeholder="Value"
        :disabled="isPluginEnabled || newMutation.kind === 'HeaderRemove'"
        class="flex-1"
      />
      <div
        v-if="newMutation.kind === 'RawMatchAndReplace'"
        class="flex items-center gap-2"
      >
        <Checkbox
          v-model="newMutation.regex"
          v-tooltip.top="'Use regex for matching'"
          :disabled="isPluginEnabled"
          binary
        />
        <label class="text-sm">Regex</label>
      </div>
      <Button
        icon="fas fa-plus"
        :disabled="isPluginEnabled || !canAddMutation"
        @click="handleAdd"
      />
    </div>
  </div>
</template>
