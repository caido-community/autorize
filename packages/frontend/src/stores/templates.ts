import { create } from "mutative";
import { defineStore } from "pinia";
import type { JobResult, Template } from "shared";
import { computed, reactive, ref, watch } from "vue";

import { useSDK } from "../plugins/sdk";
import { useTemplatesRepository } from "../repositories/templates";

export const useTemplatesStore = defineStore("templates", () => {
  const sdk = useSDK();
  const repository = useTemplatesRepository();
  const data = reactive<Template[]>([]);
  const selectedID = ref<number | undefined>(undefined);
  const selectedRequestID = ref<string | undefined>(undefined);

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
    const result = await repository.getTemplates();
    switch (result.type) {
      case "Ok":
        data.splice(0, data.length, ...result.templates);
        break;
      case "Err":
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
        selectedRequestID.value = undefined;
      }
    }
  };

  const clearAllClientSide = () => {
    data.splice(0, data.length);
    selectedID.value = undefined;
    selectedRequestID.value = undefined;
  };

  const deleteTemplate = async (id: number) => {
    const result = await repository.deleteTemplate(id);
    switch (result.type) {
      case "Ok":
        sdk.window.showToast("Template deleted", { variant: "success" });
        break;
      case "Err":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const select = (template: Template | undefined) => {
    selectedID.value = template?.id;
    selectedRequestID.value = template?.request.id;
  };

  const selectResult = (result: JobResult & { kind: "Ok" }) => {
    selectedRequestID.value = result.request.id;
  };

  const rerun = async (id: number) => {
    const result = await repository.rerunTemplate(id);
    switch (result.type) {
      case "Ok":
        sdk.window.showToast("Template rerun started", { variant: "success" });
        break;
      case "Err":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const clearAll = async () => {
    const result = await repository.clearAllTemplates();
    switch (result.type) {
      case "Ok":
        sdk.window.showToast("All templates cleared", { variant: "success" });
        break;
      case "Err":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const rescanAll = async () => {
    const result = await repository.rescanAllTemplates();
    switch (result.type) {
      case "Ok":
        sdk.window.showToast("Rescanning all templates", {
          variant: "success",
        });
        break;
      case "Err":
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
      selectedRequestID.value = value?.request.id;
    },
  });

  watch(selectedID, (newID) => {
    selectedRequestID.value = data.find((t) => t.id === newID)?.request.id;
  });

  return {
    data,
    selectedID,
    selectedRequestID,
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
  };
});
