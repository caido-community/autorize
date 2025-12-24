<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { ProfileMutation } from "shared";
import { computed, ref } from "vue";

import { MUTATION_TYPES } from "../constants";

import { useConfigStore } from "@/stores/config";

const { profileId } = defineProps<{
  profileId: string;
}>();

const configStore = useConfigStore();
const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

type MutationInput = {
  kind: ProfileMutation["kind"];
  header: string;
  cookie: string;
  match: string;
  value: string;
  regex: boolean;
};

const newMutation = ref<MutationInput>({
  kind: "HeaderReplace",
  header: "",
  cookie: "",
  match: "",
  value: "",
  regex: false,
});

const canAddMutation = computed(() => {
  const mutation = newMutation.value;

  if (mutation.kind === "RawMatchAndReplace") {
    return mutation.match !== "" && mutation.value !== "";
  }

  if (mutation.kind === "HeaderRemove") {
    return mutation.header !== "";
  }

  if (mutation.kind === "CookieRemove") {
    return mutation.cookie !== "";
  }

  if (mutation.kind === "CookieAdd" || mutation.kind === "CookieReplace") {
    return mutation.cookie !== "" && mutation.value !== "";
  }

  return mutation.header !== "" && mutation.value !== "";
});

const handleAdd = async () => {
  if (!canAddMutation.value) return;

  const userProfiles = configStore.data?.userProfiles ?? [];
  const profile = userProfiles.find((p) => p.id === profileId);
  if (!profile) return;

  const mutation = newMutation.value;
  let newProfileMutation: ProfileMutation;

  if (mutation.kind === "HeaderRemove") {
    newProfileMutation = {
      kind: "HeaderRemove",
      header: mutation.header,
    };
  } else if (mutation.kind === "CookieRemove") {
    newProfileMutation = {
      kind: "CookieRemove",
      cookie: mutation.cookie,
    };
  } else if (mutation.kind === "RawMatchAndReplace") {
    newProfileMutation = {
      kind: "RawMatchAndReplace",
      match: mutation.match,
      value: mutation.value,
      regex: mutation.regex,
    };
  } else if (
    mutation.kind === "CookieAdd" ||
    mutation.kind === "CookieReplace"
  ) {
    newProfileMutation = {
      kind: mutation.kind,
      cookie: mutation.cookie,
      value: mutation.value,
    };
  } else {
    newProfileMutation = {
      kind: mutation.kind,
      header: mutation.header,
      value: mutation.value,
    };
  }

  await configStore.update({
    userProfiles: userProfiles.map((p) =>
      p.id === profileId
        ? { ...p, mutations: [...p.mutations, newProfileMutation] }
        : p,
    ),
  });

  // Reset form
  newMutation.value = {
    kind: "HeaderReplace",
    header: "",
    cookie: "",
    match: "",
    value: "",
    regex: false,
  };
};
</script>

<template>
  <div class="border border-surface-700 rounded p-3 space-y-2">
    <h4 class="text-sm font-semibold">Add Mutation</h4>
    <div class="flex gap-3 items-center">
      <Select
        v-model="newMutation.kind"
        :options="MUTATION_TYPES"
        option-label="label"
        option-value="value"
        class="w-40"
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
