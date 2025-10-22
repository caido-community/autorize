import type { Mutation, MutationType } from "shared";
import { computed, type Ref, ref, watch } from "vue";

import { useConfigStore } from "@/stores/config";

type MutationInput = {
  type: MutationType;
  kind: Mutation["kind"];
  header: string;
  match: string;
  value: string;
};

export const useCreateForm = (selectedType: Ref<MutationType>) => {
  const configStore = useConfigStore();

  const newMutation = ref<MutationInput>({
    type: selectedType.value,
    kind: "HeaderReplace",
    header: "",
    match: "",
    value: "",
  });

  watch(selectedType, (newType) => {
    newMutation.value.type = newType;
  });

  const canAddMutation = computed(() => {
    const mutation = newMutation.value;

    if (mutation.kind === "RawMatchAndReplace") {
      return mutation.match !== "" && mutation.value !== "";
    }

    if (mutation.kind === "HeaderRemove") {
      return mutation.header !== "";
    }

    return mutation.header !== "" && mutation.value !== "";
  });

  const handleAdd = () => {
    if (!canAddMutation.value) return;

    const mutations = configStore.data?.mutations ?? [];
    const mutation = newMutation.value;

    if (mutation.kind === "HeaderRemove") {
      mutations.push({
        type: mutation.type,
        kind: "HeaderRemove",
        header: mutation.header,
      });
    } else if (mutation.kind === "RawMatchAndReplace") {
      mutations.push({
        type: mutation.type,
        kind: "RawMatchAndReplace",
        match: mutation.match,
        value: mutation.value,
      });
    } else {
      mutations.push({
        type: mutation.type,
        kind: mutation.kind,
        header: mutation.header,
        value: mutation.value,
      });
    }

    configStore.update({ mutations: [...mutations] });

    newMutation.value = {
      type: selectedType.value,
      kind: "HeaderAdd",
      header: "",
      match: "",
      value: "",
    };
  };

  const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

  return {
    newMutation,
    canAddMutation,
    handleAdd,
    isPluginEnabled,
  };
};
