<script setup lang="ts">
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";
import { computed } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useTemplatesStore } from "@/stores/templates";

const sdk = useSDK();
const store = useTemplatesStore();
const selectedTemplate = computed(() => store.selectedTemplate);

const options = computed(() => {
  if (selectedTemplate.value === undefined) return [];
  const resultTypes = selectedTemplate.value.results
    .filter((result) => result.kind === "Ok")
    .map((result) => result.type);
  return resultTypes;
});

const selection = computed({
  get: () => {
    if (
      store.selectedRequestID === undefined ||
      selectedTemplate.value === undefined
    )
      return options.value[0] ?? "";

    const selectedIndex = selectedTemplate.value.results.findIndex((result) => {
      return (
        result.kind === "Ok" && result.request.id === store.selectedRequestID
      );
    });

    if (selectedIndex >= 0) {
      const result = selectedTemplate.value.results[selectedIndex];
      return result?.kind === "Ok" ? result.type : "";
    }

    return options.value[0] ?? "";
  },
  set: (option) => {
    if (selectedTemplate.value === undefined) return;

    const result = selectedTemplate.value.results.find(
      (r) => r.kind === "Ok" && r.type === option,
    );
    if (result === undefined) return;

    switch (result.kind) {
      case "Ok":
        store.selectResult(result);
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
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
            :allow-empty="false"
            @mousedown="onSelectButtonMouseDown"
          >
            <template #option="{ option }">
              <span>{{ option }}</span>
            </template>
          </SelectButton>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped></style>
