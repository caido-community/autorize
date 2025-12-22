<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import type { MutationType, ProfileMutation, UserProfile } from "shared";
import { computed, ref } from "vue";

import { CreateForm } from "./CreateForm";
import { CreateFormProfile } from "./CreateFormProfile";
import { MutationsTable } from "./Table";

import { useConfigStore } from "@/stores/config";

type SelectedMode = MutationType | "multi-users";

const configStore = useConfigStore();
const selectedType = ref<SelectedMode>("mutated");

const userProfiles = computed(() => configStore.data?.userProfiles ?? []);
const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

if (userProfiles.value.length > 0) {
  selectedType.value = "multi-users";
}

const requestTypes = [
  {
    label: "Mutated",
    value: "mutated",
    tooltip: "Single low-privilege user mutations",
  },
  {
    label: "Multi-users",
    value: "multi-users",
    tooltip: "Multiple user profiles for testing",
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

const getTypeDescription = (type: SelectedMode) => {
  const descriptions: Record<SelectedMode, string> = {
    mutated: "Configure mutations for a single low-privilege user.",
    "multi-users":
      "Configure multiple user profiles to test authorization against multiple users.",
    "no-auth":
      "Configure mutations for the unauthenticated request. Autorize already removes some headers by default.",
    baseline:
      "Configure mutations for the baseline (original) request. This will affect every request sent.",
  };
  return descriptions[type] ?? "";
};

// Multi-users editing state
const editingProfileId = ref<string | undefined>(undefined);
const editingMutationIndex = ref<number | undefined>(undefined);

const generateId = () => crypto.randomUUID();

const handleAddProfile = async () => {
  const newProfile: UserProfile = {
    id: generateId(),
    name: `User ${userProfiles.value.length + 2}`,
    enabled: true,
    mutations: [],
  };
  await configStore.update({
    userProfiles: [...userProfiles.value, newProfile],
  });
};

const handleRemoveProfile = async (profileId: string) => {
  await configStore.update({
    userProfiles: userProfiles.value.filter((p) => p.id !== profileId),
  });
};

const handleToggleProfile = async (profileId: string, enabled: boolean) => {
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId ? { ...p, enabled } : p,
    ),
  });
};

const handleUpdateProfileName = async (profileId: string, name: string) => {
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId ? { ...p, name } : p,
    ),
  });
};

const handleRemoveMutation = async (
  profileId: string,
  mutationIndex: number,
) => {
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId
        ? { ...p, mutations: p.mutations.filter((_, i) => i !== mutationIndex) }
        : p,
    ),
  });
};

const getMutationField = (mutation: ProfileMutation): string => {
  if ("header" in mutation) return mutation.header;
  if ("cookie" in mutation) return mutation.cookie;
  if ("match" in mutation) return mutation.match;
  return "";
};

const getMutationValue = (mutation: ProfileMutation): string => {
  if ("value" in mutation) return mutation.value;
  return "";
};

const MUTATION_TYPE_LABELS: Record<string, string> = {
  HeaderAdd: "Header Add",
  HeaderRemove: "Header Remove",
  HeaderReplace: "Header Replace",
  CookieAdd: "Cookie Add",
  CookieRemove: "Cookie Remove",
  CookieReplace: "Cookie Replace",
  RawMatchAndReplace: "Match & Replace",
};

const getMutationTypeLabel = (kind: string) => {
  return MUTATION_TYPE_LABELS[kind] ?? kind;
};

const isEditing = (profileId: string, index: number) => {
  return (
    editingProfileId.value === profileId && editingMutationIndex.value === index
  );
};

const toggleEdit = (profileId: string, index: number) => {
  if (isEditing(profileId, index)) {
    editingProfileId.value = undefined;
    editingMutationIndex.value = undefined;
  } else {
    editingProfileId.value = profileId;
    editingMutationIndex.value = index;
  }
};

const handleUpdateMutationField = async (
  profileId: string,
  mutationIndex: number,
  field: string,
) => {
  const profile = userProfiles.value.find((p) => p.id === profileId);
  if (!profile) return;
  const mutation = profile.mutations[mutationIndex];
  if (!mutation) return;

  let updatedMutation: ProfileMutation;
  if ("header" in mutation) {
    updatedMutation = { ...mutation, header: field };
  } else if ("cookie" in mutation) {
    updatedMutation = { ...mutation, cookie: field };
  } else {
    updatedMutation = { ...mutation, match: field };
  }

  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId
        ? {
            ...p,
            mutations: p.mutations.map((m, i) =>
              i === mutationIndex ? updatedMutation : m,
            ),
          }
        : p,
    ),
  });
};

const handleUpdateMutationValue = async (
  profileId: string,
  mutationIndex: number,
  value: string,
) => {
  const profile = userProfiles.value.find((p) => p.id === profileId);
  if (!profile) return;
  const mutation = profile.mutations[mutationIndex];
  if (!mutation || !("value" in mutation)) return;

  const updatedMutation = { ...mutation, value };

  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId
        ? {
            ...p,
            mutations: p.mutations.map((m, i) =>
              i === mutationIndex ? updatedMutation : m,
            ),
          }
        : p,
    ),
  });
};

const onProfileNameBlur = (profileId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  handleUpdateProfileName(profileId, target.value);
};

const onMutationFieldBlur = (
  profileId: string,
  mutationIndex: number,
  event: Event,
) => {
  const target = event.target as HTMLInputElement;
  handleUpdateMutationField(profileId, mutationIndex, target.value);
};

const onMutationValueBlur = (
  profileId: string,
  mutationIndex: number,
  event: Event,
) => {
  const target = event.target as HTMLInputElement;
  handleUpdateMutationValue(profileId, mutationIndex, target.value);
};

const legacySelectedType = computed(() => selectedType.value as MutationType);
const legacyRequestTypes = computed(() =>
  requestTypes.filter((r) => r.value !== "multi-users"),
);
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

      <!-- Multi-users mode -->
      <template v-if="selectedType === 'multi-users'">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-surface-400">User Profiles</span>
          <Button
            label="Add User"
            icon="fas fa-plus"
            size="small"
            :disabled="isPluginEnabled"
            @click="handleAddProfile"
          />
        </div>

        <div
          v-if="userProfiles.length === 0"
          class="text-center py-8 text-surface-400"
        >
          No user profiles configured. Add a user to test authorization with
          multiple users.
        </div>

        <div class="flex-1 min-h-0 overflow-auto flex flex-col gap-3">
          <Card
            v-for="profile in userProfiles"
            :key="profile.id"
            :pt="{ body: { class: 'p-3' }, content: { class: 'p-0' } }"
          >
            <template #content>
              <div class="flex flex-col gap-2">
                <!-- Profile Header -->
                <div class="flex items-center gap-3">
                  <Checkbox
                    :model-value="profile.enabled"
                    binary
                    :disabled="isPluginEnabled"
                    @update:model-value="
                      handleToggleProfile(profile.id, $event)
                    "
                  />
                  <InputText
                    :model-value="profile.name"
                    :disabled="isPluginEnabled"
                    class="flex-1"
                    @blur="onProfileNameBlur(profile.id, $event)"
                  />
                  <Button
                    icon="fas fa-trash"
                    severity="danger"
                    text
                    size="small"
                    :disabled="isPluginEnabled"
                    @click="handleRemoveProfile(profile.id)"
                  />
                </div>

                <!-- Mutations Table -->
                <DataTable
                  :value="profile.mutations"
                  striped-rows
                  :pt="{
                    root: { class: 'border border-surface-700 rounded' },
                    table: { class: 'w-full table-fixed' },
                  }"
                >
                  <Column field="kind" header="Type" style="width: 20%">
                    <template #body="{ data }">
                      {{ getMutationTypeLabel(data.kind) }}
                    </template>
                  </Column>
                  <Column header="Field" style="width: 28%">
                    <template #body="{ data, index }">
                      <InputText
                        v-if="isEditing(profile.id, index)"
                        :model-value="getMutationField(data)"
                        autofocus
                        fluid
                        @blur="onMutationFieldBlur(profile.id, index, $event)"
                      />
                      <span
                        v-else
                        class="block text-ellipsis whitespace-nowrap overflow-hidden"
                      >
                        {{ getMutationField(data) }}
                      </span>
                    </template>
                  </Column>
                  <Column header="Value" style="width: 35%">
                    <template #body="{ data, index }">
                      <InputText
                        v-if="isEditing(profile.id, index) && 'value' in data"
                        :model-value="getMutationValue(data)"
                        fluid
                        @blur="onMutationValueBlur(profile.id, index, $event)"
                      />
                      <span
                        v-else
                        class="block text-ellipsis whitespace-nowrap overflow-hidden"
                      >
                        {{ getMutationValue(data) }}
                      </span>
                    </template>
                  </Column>
                  <Column header="Actions" style="width: 17%">
                    <template #body="{ index }">
                      <Button
                        :icon="
                          isEditing(profile.id, index)
                            ? 'fas fa-check'
                            : 'fas fa-pencil'
                        "
                        text
                        :severity="
                          isEditing(profile.id, index) ? 'success' : 'info'
                        "
                        size="small"
                        :disabled="isPluginEnabled"
                        @click="toggleEdit(profile.id, index)"
                      />
                      <Button
                        icon="fas fa-trash"
                        text
                        severity="danger"
                        size="small"
                        :disabled="isPluginEnabled"
                        @click="handleRemoveMutation(profile.id, index)"
                      />
                    </template>
                  </Column>
                  <template #empty>
                    <div class="text-center py-2 text-surface-400">
                      No mutations
                    </div>
                  </template>
                </DataTable>

                <!-- Add Mutation - using CreateFormProfile component -->
                <CreateFormProfile :profile-id="profile.id" />
              </div>
            </template>
          </Card>
        </div>
      </template>

      <!-- Legacy single-user mode -->
      <template v-else>
        <MutationsTable
          :selected-type="legacySelectedType"
          :request-types="legacyRequestTypes"
        />
        <div class="mt-4">
          <CreateForm :selected-type="legacySelectedType" />
        </div>
      </template>
    </template>
  </Card>
</template>
