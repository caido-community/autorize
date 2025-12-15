<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { MutationType } from "shared";
import { toRef } from "vue";

import { MUTATION_TYPES } from "../constants";

import { useCreateForm } from "./useCreateForm";

const { selectedType } = defineProps<{
  selectedType: MutationType;
}>();
const { newMutation, canAddMutation, handleAdd, isPluginEnabled } =
  useCreateForm(toRef(() => selectedType));
</script>

<template>
  <div class="border border-surface-700 rounded p-4 space-y-3">
    <h4 class="text-sm font-semibold">Add Mutation</h4>
    <div class="flex gap-3 items-center">
      <Select
        v-model="newMutation.kind"
        :options="MUTATION_TYPES"
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
        v-else-if="
          newMutation.kind === 'CookieAdd' ||
          newMutation.kind === 'CookieRemove' ||
          newMutation.kind === 'CookieReplace'
        "
        v-model="newMutation.cookie"
        placeholder="Cookie name"
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
        :disabled="
          isPluginEnabled ||
          newMutation.kind === 'HeaderRemove' ||
          newMutation.kind === 'CookieRemove'
        "
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
