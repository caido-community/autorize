<script setup lang="ts">
import Card from "primevue/card";
import SelectButton from "primevue/selectbutton";
import { computed, ref } from "vue";

import { GeneralSettings } from "./General";
import { Mutations } from "./Mutations";
import { PassiveScanning } from "./Passive";
import { UISettings } from "./UI";

type Tab = "Mutations" | "PassiveScanning" | "GeneralSettings" | "UISettings";

const activeTab = ref<Tab>("Mutations");

const tabs: Array<{ label: string; value: Tab }> = [
  { label: "Mutations", value: "Mutations" },
  { label: "Scanning", value: "PassiveScanning" },
  { label: "General", value: "GeneralSettings" },
  { label: "UI", value: "UISettings" },
];

const component = computed(() => {
  switch (activeTab.value) {
    case "Mutations":
      return Mutations;
    case "PassiveScanning":
      return PassiveScanning;
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
  <div class="h-full flex flex-col gap-1">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0 flex flex-col' },
        content: { class: 'h-fit flex flex-col' },
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
      class="h-full"
      :pt="{
        body: { class: 'h-full p-0 flex flex-col' },
        content: { class: 'h-full flex flex-col' },
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
