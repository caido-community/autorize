import { create } from "mutative";
import { defineStore } from "pinia";
import type { JobResult, MutationType, Template } from "shared";
import { computed, reactive, ref } from "vue";

import { useSDK } from "../plugins/sdk";

export const useTemplatesStore = defineStore("templates", () => {
  const sdk = useSDK();
  const data = reactive<Template[]>([]);
  const selectedID = ref<number | undefined>(undefined);
  const lastSelectedResultType = ref<MutationType>("baseline");

  const initialize = async () => {
    await fetch();

    sdk.backend.onEvent("template:created", (template) => {
      data.push(template);
    });

    sdk.backend.onEvent("template:updated", (templateID, template) => {
      update(templateID, template);
    });

    sdk.backend.onEvent("template:deleted", (templateID) => {
      remove(templateID);
    });

    sdk.backend.onEvent("templates:cleared", () => {
      clearAllClientSide();
    });
  };

  const fetch = async () => {
    const result = await sdk.backend.getTemplates();
    switch (result.kind) {
      case "Ok":
        data.splice(0, data.length, ...result.value);
        break;
      case "Error":
        console.error(result.error);
        break;
    }
  };

  const add = (template: Template) => {
    data.push(template);
  };

  const update = (id: number, updates: Omit<Template, "id">) => {
    const index = data.findIndex((t) => t.id === id);
    if (index !== -1) {
      const template = data[index];
      if (template !== undefined) {
        data[index] = create(template, (draft) => {
          Object.assign(draft, updates);
        });
      }
    }
  };

  const remove = (id: number) => {
    const index = data.findIndex((t) => t.id === id);
    if (index !== -1) {
      data.splice(index, 1);
      if (selectedID.value === id) {
        selectedID.value = undefined;
      }
    }
  };

  const clearAllClientSide = () => {
    data.splice(0, data.length);
    selectedID.value = undefined;
  };

  const deleteTemplate = async (id: number) => {
    const result = await sdk.backend.deleteTemplate(id);
    switch (result.kind) {
      case "Ok":
        sdk.window.showToast("Template deleted", { variant: "success" });
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const select = (template: Template | undefined) => {
    selectedID.value = template?.id;
  };

  const selectResult = (result: JobResult & { kind: "Ok" }) => {
    lastSelectedResultType.value = result.type;
  };

  const rerun = async (id: number) => {
    const result = await sdk.backend.rerunTemplate(id);
    switch (result.kind) {
      case "Ok":
        sdk.window.showToast("Template rerun started", { variant: "success" });
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const clearAll = async () => {
    const result = await sdk.backend.clearAllTemplates();
    switch (result.kind) {
      case "Ok":
        sdk.window.showToast("All templates cleared", { variant: "success" });
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const rescanAll = async () => {
    const result = await sdk.backend.rescanAllTemplates();
    switch (result.kind) {
      case "Ok":
        sdk.window.showToast("Rescanning all templates", {
          variant: "success",
        });
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const selectedTemplate = computed<Template | undefined>({
    get() {
      return data.find((t) => t.id === selectedID.value);
    },
    set(value: Template | undefined) {
      selectedID.value = value?.id;
    },
  });

  const selectedRequestID = computed(() => {
    const template = selectedTemplate.value;
    if (template === undefined) return undefined;

    const preferredResult = template.results.find(
      (r) => r.kind === "Ok" && r.type === lastSelectedResultType.value,
    );

    if (preferredResult !== undefined && preferredResult.kind === "Ok") {
      return preferredResult.request.id;
    }

    const fallbackResult = template.results.find((r) => r.kind === "Ok");
    return fallbackResult !== undefined && fallbackResult.kind === "Ok"
      ? fallbackResult.request.id
      : undefined;
  });

  const orderedResults = computed(() => {
    const template = selectedTemplate.value;
    if (template === undefined) return [];

    const okResults = template.results.filter((r) => r.kind === "Ok");
    const order: MutationType[] = ["baseline", "mutated", "no-auth"];

    return okResults.sort((a, b) => {
      if (a.kind !== "Ok" || b.kind !== "Ok") return 0;

      const aIndex = order.indexOf(a.type);
      const bIndex = order.indexOf(b.type);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  });

  return {
    data,
    selectedID,
    selectedRequestID,
    lastSelectedResultType,
    fetch,
    add,
    update,
    remove,
    deleteTemplate,
    select,
    selectResult,
    rerun,
    clearAll,
    rescanAll,
    initialize,
    selectedTemplate,
    orderedResults,
  };
});
