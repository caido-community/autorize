<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Checkbox from "primevue/checkbox";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { MutationType } from "shared";
import { computed, onMounted, ref, watch } from "vue";

import { CreateForm } from "./CreateForm";
import { CreateFormProfile } from "./CreateFormProfile";
import ProfileMutationsTable from "./ProfileMutationsTable.vue";
import { MutationsTable } from "./Table";

import { useConfigStore } from "@/stores/config";
import { createDefaultProfile } from "@/utils";

type SelectedMode = string;

const configStore = useConfigStore();
const selectedType = ref<SelectedMode>("user-default");

const userProfiles = computed(() => configStore.data?.userProfiles ?? []);
const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

const ensureDefaultProfile = async () => {
  if (
    userProfiles.value.length === 0 &&
    configStore.data &&
    !isPluginEnabled.value
  ) {
    await configStore.update({ userProfiles: [createDefaultProfile()] });
  }
};

onMounted(async () => {
  await ensureDefaultProfile();
  if (userProfiles.value.length > 0) {
    selectedType.value = `user-${userProfiles.value[0]?.id}`;
  }
});

watch(userProfiles, (profiles) => {
  if (profiles.length > 0 && selectedType.value === "user-default") {
    selectedType.value = `user-${profiles[0]?.id}`;
  }
});

const requestTypes = computed(() => {
  const userOptions = userProfiles.value.map((p) => ({
    label: p.name,
    value: `user-${p.id}`,
    tooltip: `Configure mutations for ${p.name}`,
    isUser: true,
  }));

  return [
    ...userOptions,
    {
      label: "No Auth",
      value: "no-auth",
      tooltip: "Mutations for the unauthenticated request",
      isUser: false,
    },
    {
      label: "Baseline",
      value: "baseline",
      tooltip: "Mutations for the baseline (original) request",
      isUser: false,
    },
  ];
});

const isUserSelected = computed(() => selectedType.value.startsWith("user-"));

const selectedProfileId = computed(() => {
  if (isUserSelected.value) {
    return selectedType.value.replace("user-", "");
  }
  return null;
});

const selectedProfile = computed(() => {
  if (selectedProfileId.value !== null) {
    return userProfiles.value.find((p) => p.id === selectedProfileId.value);
  }
  return null;
});

const legacySelectedType = computed<MutationType | undefined>(() => {
  if (selectedType.value === "no-auth") return "no-auth";
  if (selectedType.value === "baseline") return "baseline";
  return undefined;
});

const getTypeDescription = () => {
  if (isUserSelected.value) {
    return "Configure mutations for this user profile.";
  }
  if (selectedType.value === "no-auth") {
    return "Mutations applied before stripping auth headers.";
  }
  if (selectedType.value === "baseline") {
    return "Mutations applied to the original request.";
  }
  return "";
};

const handleAddProfile = async () => {
  const newProfile = createDefaultProfile();
  newProfile.name = `User ${userProfiles.value.length + 1}`;
  await configStore.update({
    userProfiles: [...userProfiles.value, newProfile],
  });
  selectedType.value = `user-${newProfile.id}`;
};

const handleDeleteProfile = async () => {
  if (selectedProfileId.value === null) return;

  if (userProfiles.value.length === 1) {
    await configStore.update({
      userProfiles: userProfiles.value.map((p) =>
        p.id === selectedProfileId.value ? { ...p, mutations: [] } : p,
      ),
    });
  } else {
    const newProfiles = userProfiles.value.filter(
      (p) => p.id !== selectedProfileId.value,
    );
    await configStore.update({ userProfiles: newProfiles });
    if (newProfiles.length > 0) {
      selectedType.value = `user-${newProfiles[0]?.id}`;
    }
  }
};

const handleProfileNameUpdate = async (event: FocusEvent) => {
  if (selectedProfileId.value === null) return;
  const target = event.target as HTMLInputElement;
  const newName = target.value.trim();
  if (newName && newName !== selectedProfile.value?.name) {
    await configStore.update({
      userProfiles: userProfiles.value.map((p) =>
        p.id === selectedProfileId.value ? { ...p, name: newName } : p,
      ),
    });
  }
};

const handleToggleProfile = async (enabled: boolean) => {
  if (selectedProfileId.value === null) return;
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === selectedProfileId.value ? { ...p, enabled } : p,
    ),
  });
};
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-4 flex flex-col' },
      content: { class: 'h-full flex flex-col min-h-0' },
    }"
  >
    <template #content>
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">Request Mutations</h3>
          <p class="text-sm text-surface-400">
            {{ getTypeDescription() }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Button
            v-if="isUserSelected"
            label="Add User"
            icon="fas fa-plus"
            size="small"
            :disabled="isPluginEnabled"
            @click="handleAddProfile"
          />
          <Select
            v-model="selectedType"
            :options="requestTypes"
            option-label="label"
            option-value="value"
            class="w-40"
          >
            <template #option="{ option }">
              <span v-tooltip.left="option.tooltip">{{ option.label }}</span>
            </template>
          </Select>
        </div>
      </div>

      <template v-if="isUserSelected && selectedProfile">
        <div class="flex items-center gap-3 mb-3">
          <Checkbox
            :model-value="selectedProfile.enabled"
            binary
            :disabled="isPluginEnabled"
            @update:model-value="handleToggleProfile"
          />
          <InputText
            :model-value="selectedProfile.name"
            :disabled="isPluginEnabled"
            class="flex-1"
            placeholder="User name"
            @blur="handleProfileNameUpdate"
          />
          <Button
            v-if="userProfiles.length > 1"
            label="Delete User"
            icon="fas fa-trash"
            severity="danger"
            text
            size="small"
            :disabled="isPluginEnabled"
            @click="handleDeleteProfile"
          />
          <Button
            v-else
            v-tooltip.left="'Clear mutations'"
            icon="fas fa-trash"
            severity="danger"
            text
            size="small"
            :disabled="isPluginEnabled"
            @click="handleDeleteProfile"
          />
        </div>

        <div class="flex-1 min-h-0 flex flex-col gap-3">
          <ProfileMutationsTable
            class="flex-1"
            :profile-id="selectedProfile.id"
          />
          <CreateFormProfile :profile-id="selectedProfile.id" />
        </div>
      </template>

      <template v-else-if="legacySelectedType">
        <MutationsTable
          class="flex-1"
          :selected-type="legacySelectedType"
          :request-types="[]"
        />
        <div class="mt-4">
          <CreateForm :selected-type="legacySelectedType" />
        </div>
      </template>
    </template>
  </Card>
</template>
