<script setup lang="ts">
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";
import { computed, ref } from "vue";

import { Filtering } from "./Filtering";
import { GeneralSettings } from "./General";
import { Mutations } from "./Mutations";
import { PassiveScanning } from "./Passive";
import { StatusDetection } from "./StatusDetection";
import { UISettings } from "./UI";

type Tab =
  | "Mutations"
  | "Filtering"
  | "PassiveScanning"
  | "StatusDetection"
  | "GeneralSettings"
  | "UISettings";

const activeTab = ref<Tab>("Mutations");

const tabs = [
  { label: "Mutations", value: "Mutations" },
  { label: "Filtering", value: "Filtering" },
  { label: "Detection", value: "StatusDetection" },
  { label: "Queue", value: "PassiveScanning" },
  { label: "General", value: "GeneralSettings" },
  { label: "UI", value: "UISettings" },
];

const component = computed(() => {
  switch (activeTab.value) {
    case "Mutations":
      return Mutations;
    case "Filtering":
      return Filtering;
    case "PassiveScanning":
      return PassiveScanning;
    case "StatusDetection":
      return StatusDetection;
    case "GeneralSettings":
      return GeneralSettings;
    case "UISettings":
      return UISettings;
    default:
      return Mutations;
  }
});
</script>

<template>
  <div class="h-full flex flex-col gap-1 min-h-0">
    <Card
      class="shrink-0"
      :pt="{
        body: { class: 'p-0' },
        content: { class: 'p-0' },
      }"
    >
      <template #content>
        <div class="px-2 py-1">
          <SelectButton
            v-model="activeTab"
            :options="tabs"
            option-label="label"
            option-value="value"
            class="w-full"
            :allow-empty="false"
          />
        </div>
      </template>
    </Card>

    <Card
      class="flex-1 min-h-0"
      :pt="{
        root: { style: 'display: flex; flex-direction: column; height: 100%;' },
        body: { class: 'flex-1 p-0 flex flex-col min-h-0' },
        content: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
      }"
    >
      <template #content>
        <div class="flex-1 min-h-0 overflow-auto">
          <component :is="component" />
        </div>
      </template>
    </Card>
  </div>
</template>
