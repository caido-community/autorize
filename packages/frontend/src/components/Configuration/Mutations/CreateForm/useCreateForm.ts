import type { Mutation, MutationType } from "shared";
import { computed, type Ref, ref, watch } from "vue";

import { useConfigStore } from "@/stores/config";

type MutationInput = {
  type: MutationType;
  kind: Mutation["kind"];
  header: string;
  cookie: string;
  match: string;
  value: string;
  regex: boolean;
};

export const useCreateForm = (selectedType: Ref<MutationType>) => {
  const configStore = useConfigStore();

  const newMutation = ref<MutationInput>({
    type: selectedType.value,
    kind: "HeaderReplace",
    header: "",
    cookie: "",
    match: "",
    value: "",
    regex: false,
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

    if (mutation.kind === "CookieRemove") {
      return mutation.cookie !== "";
    }

    if (mutation.kind === "CookieAdd" || mutation.kind === "CookieReplace") {
      return mutation.cookie !== "" && mutation.value !== "";
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
    } else if (mutation.kind === "CookieRemove") {
      mutations.push({
        type: mutation.type,
        kind: "CookieRemove",
        cookie: mutation.cookie,
      });
    } else if (mutation.kind === "RawMatchAndReplace") {
      mutations.push({
        type: mutation.type,
        kind: "RawMatchAndReplace",
        match: mutation.match,
        value: mutation.value,
        regex: mutation.regex,
      });
    } else if (
      mutation.kind === "CookieAdd" ||
      mutation.kind === "CookieReplace"
    ) {
      mutations.push({
        type: mutation.type,
        kind: mutation.kind,
        cookie: mutation.cookie,
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
      cookie: "",
      match: "",
      value: "",
      regex: false,
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
