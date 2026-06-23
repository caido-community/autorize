<script setup lang="ts">
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { SessionManagement, TokenExtraction } from "shared";
import { computed, ref } from "vue";

import { useConfigStore } from "@/stores/config";

const { profileId, disabled } = defineProps<{
  profileId: string;
  disabled: boolean;
}>();

const configStore = useConfigStore();

const EXTRACTION_TYPES = [
  { label: "Header", value: "Header" },
  { label: "JSON Body", value: "JsonBody" },
  { label: "Regex", value: "Regex" },
] as const;

type ExtractionKind = "Header" | "JsonBody" | "Regex";

const selectedKind = ref<ExtractionKind>("Header");
const keyValue = ref("");
const envVar = ref("");

const keyPlaceholder = computed(() => {
  switch (selectedKind.value) {
    case "Header":
      return "Header name";
    case "JsonBody":
      return "JSON path (e.g. data.access_token)";
    case "Regex":
      return "Regex with capture group";
    default:
      return "";
  }
});

const canAdd = computed(
  () => keyValue.value.trim() !== "" && envVar.value.trim() !== "",
);

const handleAdd = async () => {
  if (!canAdd.value) return;

  const userProfiles = configStore.data?.userProfiles ?? [];
  const profile = userProfiles.find((p) => p.id === profileId);
  if (profile?.sessionManagement === undefined) return;

  const key = keyValue.value.trim();
  const env = envVar.value.trim();

  let extraction: TokenExtraction;
  switch (selectedKind.value) {
    case "Header":
      extraction = {
        kind: "Header",
        headerName: key,
        envVar: env,
      };
      break;
    case "JsonBody":
      extraction = {
        kind: "JsonBody",
        jsonPath: key,
        envVar: env,
      };
      break;
    case "Regex":
      extraction = { kind: "Regex", pattern: key, envVar: env };
      break;
  }

  const updated: SessionManagement = {
    ...profile.sessionManagement,
    tokenExtractions: [
      ...profile.sessionManagement.tokenExtractions,
      extraction,
    ],
  };

  await configStore.update({
    userProfiles: userProfiles.map((p) =>
      p.id === profileId ? { ...p, sessionManagement: updated } : p,
    ),
  });

  keyValue.value = "";
  envVar.value = "";
};
</script>

<template>
  <div class="border border-surface-700 rounded p-3 space-y-2">
    <h4 class="text-sm font-semibold">Add Extraction Rule</h4>
    <div class="flex gap-3 items-center">
      <Select
        v-model="selectedKind"
        :options="EXTRACTION_TYPES"
        option-label="label"
        option-value="value"
        :disabled="disabled"
        class="w-32"
      />
      <InputText
        v-model="keyValue"
        :disabled="disabled"
        :placeholder="keyPlaceholder"
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <InputText
        v-model="envVar"
        :disabled="disabled"
        placeholder="Env variable"
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <Button
        icon="fas fa-plus"
        :disabled="disabled || !canAdd"
        @click="handleAdd"
      />
    </div>
  </div>
</template>
