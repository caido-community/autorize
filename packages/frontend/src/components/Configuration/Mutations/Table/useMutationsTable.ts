import type { Mutation } from "shared";
import { computed, ref } from "vue";

import { useConfigStore } from "@/stores/config";

export const useMutationsTable = () => {
  const configStore = useConfigStore();
  const editingRows = ref<Set<number>>(new Set());

  const mutations = computed(() => configStore.data?.mutations ?? []);
  const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

  const toggleEdit = (index: number) => {
    const newEditingRows = new Set(editingRows.value);
    if (newEditingRows.has(index)) {
      newEditingRows.delete(index);
    } else {
      newEditingRows.add(index);
    }
    editingRows.value = newEditingRows;
  };

  const isEditing = (index: number) => {
    return editingRows.value.has(index);
  };

  const handleFieldUpdate = (index: number, value: string) => {
    const mutation = mutations.value[index];
    if (mutation === undefined) return;

    if (mutation.kind === "RawMatchAndReplace") {
      mutation.match = value;
    } else {
      mutation.header = value;
    }

    configStore.update({ mutations: [...mutations.value] });
  };

  const handleValueUpdate = (index: number, value: string) => {
    const mutation = mutations.value[index];
    if (mutation === undefined) return;

    if (mutation.kind !== "HeaderRemove") {
      mutation.value = value;
    }

    configStore.update({ mutations: [...mutations.value] });
  };

  const handleRemove = (index: number) => {
    const updated = [...mutations.value];
    updated.splice(index, 1);
    configStore.update({ mutations: updated });
  };

  const getMutationField = (mutation: Mutation): string => {
    if (mutation.kind === "RawMatchAndReplace") {
      return mutation.match;
    }
    return mutation.header;
  };

  const getMutationValue = (mutation: Mutation): string => {
    if (mutation.kind === "HeaderRemove") {
      return "-";
    }
    return mutation.value;
  };

  return {
    mutations,
    isPluginEnabled,
    editingRows,
    toggleEdit,
    isEditing,
    handleFieldUpdate,
    handleValueUpdate,
    handleRemove,
    getMutationField,
    getMutationValue,
  };
};
