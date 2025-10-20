<script setup lang="ts">
import Card from "primevue/card";
import Select from "primevue/select";
import type { MutationType } from "shared";
import { ref } from "vue";

import { CreateForm } from "./CreateForm";
import { MutationsTable } from "./Table";

const selectedType = ref<MutationType>("mutated");

const requestTypes = [
  {
    label: "Mutated",
    value: "mutated",
    tooltip: "Mutations for the low-privilege user request",
  },
  {
    label: "No Auth",
    value: "no-auth",
    tooltip: "Mutations for the unauthenticated request",
  },
  {
    label: "Baseline",
    value: "baseline",
    tooltip: "Mutations for the baseline (original) request",
  },
] as const;

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

      <MutationsTable
        :selected-type="selectedType"
        :request-types="requestTypes"
      />

      <div class="mt-4">
        <CreateForm :selected-type="selectedType" />
      </div>
    </template>
  </Card>
</template>
