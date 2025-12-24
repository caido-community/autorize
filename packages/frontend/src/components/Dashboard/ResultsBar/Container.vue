<script setup lang="ts">
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";
import { computed } from "vue";

import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const selectedTemplate = computed(() => store.selectedTemplate);

const options = computed(() => {
  return store.orderedResults
    .map((result) => {
      if (result.kind !== "Ok") return null;

      if (result.type === "mutated") {
        return {
          key: result.userProfileId ?? "mutated",
          label: result.userProfileName ?? "mutated",
          type: "mutated",
          userProfileId: result.userProfileId,
        };
      }

      return {
        key: result.type,
        label: result.type,
        type: result.type,
        userProfileId: undefined,
      };
    })
    .filter((opt): opt is NonNullable<typeof opt> => opt !== null);
});

const selection = computed({
  get: () => {
    if (
      store.selectedRequestID === undefined ||
      selectedTemplate.value === undefined
    )
      return options.value[0]?.key ?? "";

    const selectedResult = selectedTemplate.value.results.find((result) => {
      return (
        result.kind === "Ok" && result.request.id === store.selectedRequestID
      );
    });

    if (selectedResult?.kind === "Ok") {
      if (selectedResult.type === "mutated") {
        return selectedResult.userProfileId ?? "mutated";
      }
      return selectedResult.type;
    }

    return options.value[0]?.key ?? "";
  },
  set: (optionKey) => {
    if (selectedTemplate.value === undefined) return;

    const option = options.value.find((o) => o.key === optionKey);
    if (!option) return;

    const result = selectedTemplate.value.results.find((r) => {
      if (r.kind !== "Ok") return false;
      if (r.type !== option.type) return false;

      if (r.type === "mutated" && option.type === "mutated") {
        return r.userProfileId === option.userProfileId;
      }

      return true;
    });

    if (result?.kind === "Ok") {
      store.selectResult(result);
    }
  },
});

const onSelectButtonMouseDown = (event: MouseEvent) => {
  const target = event.target as HTMLButtonElement;
  target.click();
};
</script>

<template>
  <Card
    v-if="selectedTemplate !== undefined"
    :pt="{ body: { style: 'padding: 0.35rem' } }"
  >
    <template #content>
      <div class="flex gap-2 items-center w-full">
        <div class="flex flex-col gap-1">
          <SelectButton
            v-model="selection"
            :options="options"
            option-label="label"
            option-value="key"
            :allow-empty="false"
            @mousedown="onSelectButtonMouseDown"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
