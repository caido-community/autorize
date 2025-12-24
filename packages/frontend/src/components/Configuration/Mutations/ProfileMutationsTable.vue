<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import type { ProfileMutation } from "shared";
import { computed, ref } from "vue";

import { MUTATION_TYPES } from "./constants";
import HighlightedValue from "./Table/HighlightedValue.vue";

import { useConfigStore } from "@/stores/config";

const { profileId } = defineProps<{
  profileId: string;
}>();

const configStore = useConfigStore();
const editingIndex = ref<number | undefined>(undefined);

const userProfiles = computed(() => configStore.data?.userProfiles ?? []);
const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

const profile = computed(() =>
  userProfiles.value.find((p) => p.id === profileId),
);

const mutations = computed(() => profile.value?.mutations ?? []);

const getMutationTypeLabel = (kind: string) => {
  const type = MUTATION_TYPES.find((t) => t.value === kind);
  return type?.label ?? kind;
};

const toggleEdit = (index: number) => {
  if (editingIndex.value === index) {
    editingIndex.value = undefined;
  } else {
    editingIndex.value = index;
  }
};

const isEditing = (index: number) => editingIndex.value === index;

const getMutationField = (mutation: ProfileMutation) => {
  if ("header" in mutation) return mutation.header;
  if ("cookie" in mutation) return mutation.cookie;
  if ("match" in mutation) return mutation.match;
  return "";
};

const getMutationValue = (mutation: ProfileMutation) => {
  if ("value" in mutation) return mutation.value;
  return "";
};

const updateMutation = async (
  index: number,
  updates: Partial<ProfileMutation>,
) => {
  if (!profile.value) return;
  const updatedMutations = [...profile.value.mutations];
  updatedMutations[index] = {
    ...updatedMutations[index],
    ...updates,
  } as ProfileMutation;
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId ? { ...p, mutations: updatedMutations } : p,
    ),
  });
};

const handleFieldUpdate = async (index: number, value: string) => {
  const mutation = mutations.value[index];
  if (!mutation) return;
  if ("header" in mutation) await updateMutation(index, { header: value });
  else if ("cookie" in mutation) await updateMutation(index, { cookie: value });
  else if ("match" in mutation) await updateMutation(index, { match: value });
  editingIndex.value = undefined;
};

const handleValueUpdate = async (index: number, value: string) => {
  await updateMutation(index, { value });
  editingIndex.value = undefined;
};

const handleRegexUpdate = async (index: number, regex: boolean) => {
  await updateMutation(index, { regex });
};

const handleRemove = async (index: number) => {
  if (!profile.value) return;
  const updatedMutations = profile.value.mutations.filter(
    (_, i) => i !== index,
  );
  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === profileId ? { ...p, mutations: updatedMutations } : p,
    ),
  });
};

const onFieldBlur = (index: number, event: FocusEvent) => {
  const target = event.target as HTMLInputElement;
  handleFieldUpdate(index, target.value);
};

const onValueBlur = (index: number, event: FocusEvent) => {
  const target = event.target as HTMLInputElement;
  handleValueUpdate(index, target.value);
};
</script>

<template>
  <DataTable
    :value="mutations"
    striped-rows
    class="h-full"
    :pt="{
      root: { class: 'border border-surface-700 rounded' },
      table: { class: 'w-full table-fixed' },
    }"
  >
    <Column field="kind" header="Type" style="width: 15%">
      <template #body="{ data }">
        {{ getMutationTypeLabel(data.kind) }}
      </template>
    </Column>
    <Column style="width: 28%">
      <template #header>
        <span
          v-tooltip.top="
            'Header/cookie name or match pattern (supports {{ VAR_NAME }} for Match and Replace)'
          "
        >
          Field
        </span>
      </template>
      <template #body="{ data, index }">
        <InputText
          v-if="isEditing(index)"
          :model-value="getMutationField(data)"
          autofocus
          fluid
          @blur="onFieldBlur(index, $event)"
          @keyup.enter="onFieldBlur(index, $event)"
        />
        <div
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          <HighlightedValue :value="getMutationField(data)" />
        </div>
      </template>
    </Column>
    <Column style="width: 40%">
      <template #header>
        <span
          v-tooltip.top="'Supports {{ VAR_NAME }} for environment variables'"
        >
          Value
        </span>
      </template>
      <template #body="{ data, index }">
        <InputText
          v-if="
            isEditing(index) &&
            data.kind !== 'HeaderRemove' &&
            data.kind !== 'CookieRemove'
          "
          :model-value="getMutationValue(data)"
          autofocus
          fluid
          @blur="onValueBlur(index, $event)"
          @keyup.enter="onValueBlur(index, $event)"
        />
        <div
          v-else
          class="block text-ellipsis whitespace-nowrap overflow-hidden"
        >
          <HighlightedValue :value="getMutationValue(data)" />
        </div>
      </template>
    </Column>
    <Column style="width: 7%">
      <template #header>
        <span v-tooltip.top="'Use regex for pattern matching'"> Regex </span>
      </template>
      <template #body="{ data, index }">
        <Checkbox
          v-if="data.kind === 'RawMatchAndReplace'"
          :model-value="data.regex"
          :disabled="isPluginEnabled"
          binary
          @update:model-value="handleRegexUpdate(index, $event)"
        />
      </template>
    </Column>
    <Column header="Actions" style="width: 10%">
      <template #body="{ index }">
        <Button
          :icon="isEditing(index) ? 'fas fa-check' : 'fas fa-pencil'"
          text
          :severity="isEditing(index) ? 'success' : 'info'"
          size="small"
          :disabled="isPluginEnabled"
          @click="toggleEdit(index)"
        />
        <Button
          icon="fas fa-trash"
          text
          severity="danger"
          size="small"
          :disabled="isPluginEnabled"
          @click="handleRemove(index)"
        />
      </template>
    </Column>
    <template #empty>
      <div class="text-center py-4 text-surface-400">
        No mutations configured. Add a mutation below.
      </div>
    </template>
  </DataTable>
</template>
