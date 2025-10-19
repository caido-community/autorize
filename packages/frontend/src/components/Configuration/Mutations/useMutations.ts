import type { Mutation } from "shared";
import { computed, ref } from "vue";

type MutationInput = {
  kind: Mutation["kind"];
  header: string;
  match: string;
  value: string;
};

export const useMutations = () => {
  const mutationTypes = [
    { label: "Add Header", value: "HeaderAdd" },
    { label: "Remove Header", value: "HeaderRemove" },
    { label: "Replace Header", value: "HeaderReplace" },
    { label: "Raw Match and Replace", value: "RawMatchAndReplace" },
  ] as const;

  const newMutation = ref<MutationInput>({
    kind: "HeaderAdd",
    header: "",
    match: "",
    value: "",
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

  const addMutation = (mutations: Mutation[]) => {
    if (!canAddMutation.value) return;

    const mutation = newMutation.value;

    if (mutation.kind === "HeaderRemove") {
      mutations.push({
        kind: "HeaderRemove",
        header: mutation.header,
      });
    } else if (mutation.kind === "RawMatchAndReplace") {
      mutations.push({
        kind: "RawMatchAndReplace",
        match: mutation.match,
        value: mutation.value,
      });
    } else {
      mutations.push({
        kind: mutation.kind,
        header: mutation.header,
        value: mutation.value,
      });
    }

    newMutation.value = {
      kind: "HeaderAdd",
      header: "",
      match: "",
      value: "",
    };
  };

  const removeMutation = (mutations: Mutation[], index: number) => {
    mutations.splice(index, 1);
  };

  const getMutationTypeLabel = (kind: string) => {
    const type = mutationTypes.find((t) => t.value === kind);
    return type?.label ?? kind;
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
    mutationTypes,
    newMutation,
    canAddMutation,
    addMutation,
    removeMutation,
    getMutationTypeLabel,
    getMutationField,
    getMutationValue,
  };
};
