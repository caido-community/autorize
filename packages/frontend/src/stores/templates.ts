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
  const lastSelectedUserProfileId = ref<string | undefined>(undefined);
  const hasActiveJobs = ref(false);
  const projectID = ref<string | undefined>(undefined);
  const activeTemplateIds = ref<number[]>([]);
  const httpqlQuery = ref<string>("");
  const filteredTemplateIds = ref<number[] | undefined>(undefined);
  const isFiltering = ref(false);
  const selectedIds = ref<Set<number>>(new Set());

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

    sdk.backend.onEvent("queue:status-changed", (hasJobs) => {
      hasActiveJobs.value = hasJobs;
    });

    sdk.backend.onEvent("project:changed", async (id) => {
      projectID.value = id;
      httpqlQuery.value = "";
      filteredTemplateIds.value = undefined;
      isFiltering.value = false;
      selectedIds.value = new Set();
      clearAllClientSide();
      await fetch();
    });

    sdk.backend.onEvent("cursor:mark", (templateId, active) => {
      if (active) {
        activeTemplateIds.value.push(templateId);
      } else {
        activeTemplateIds.value = activeTemplateIds.value.filter(
          (id) => id !== templateId,
        );
      }
    });

    sdk.backend.onEvent("cursor:clear", () => {
      activeTemplateIds.value = [];
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
    // Track userProfileId for mutated results to enable multi-user selection
    if (result.type === "mutated") {
      lastSelectedUserProfileId.value = result.userProfileId;
    } else {
      lastSelectedUserProfileId.value = undefined;
    }
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

  const stopQueue = async () => {
    const result = await sdk.backend.clearQueue();
    switch (result.kind) {
      case "Ok":
        // wait for queue to be idle
        if (hasActiveJobs.value) {
          await new Promise<void>((resolve) => {
            const listener = sdk.backend.onEvent(
              "queue:status-changed",
              (hasJobs) => {
                if (!hasJobs) {
                  listener.stop();
                  resolve();
                }
              },
            );
          });
        }
        sdk.window.showToast("Queue stopped", { variant: "success" });
        break;
      case "Error":
        sdk.window.showToast(result.error, { variant: "error" });
        break;
    }
  };

  const filterByHttpql = async (query: string) => {
    httpqlQuery.value = query;

    if (query === "") {
      filteredTemplateIds.value = undefined;
      isFiltering.value = false;
      return;
    }

    isFiltering.value = true;
    const result = await sdk.backend.filterTemplates(query);
    if (result.kind === "Ok") {
      filteredTemplateIds.value = result.value;
    } else {
      sdk.window.showToast(result.error, { variant: "error" });
      filteredTemplateIds.value = undefined;
    }
    isFiltering.value = false;
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

    const preferredResult = template.results.find((r) => {
      if (r.kind !== "Ok") return false;
      if (r.type !== lastSelectedResultType.value) return false;

      if (
        r.type === "mutated" &&
        lastSelectedUserProfileId.value !== undefined
      ) {
        return r.userProfileId === lastSelectedUserProfileId.value;
      }

      return true;
    });

    if (preferredResult !== undefined && preferredResult.kind === "Ok") {
      return preferredResult.request.id;
    }

    const fallbackResult = template.results.find((r) => r.kind === "Ok");
    return fallbackResult !== undefined && fallbackResult.kind === "Ok"
      ? fallbackResult.request.id
      : undefined;
  });

  const filteredData = computed(() => {
    if (filteredTemplateIds.value === undefined) {
      return data;
    }
    return data.filter(
      (t) =>
        filteredTemplateIds.value !== undefined &&
        filteredTemplateIds.value.includes(t.id),
    );
  });

  const hasSelection = computed(() => selectedIds.value.size > 0);

  const allSelected = computed(() => {
    const visibleData = filteredData.value;
    return (
      visibleData.length > 0 && selectedIds.value.size === visibleData.length
    );
  });

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds.value);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    selectedIds.value = newSet;
  };

  const selectAll = () => {
    const visibleIds = filteredData.value.map((t) => t.id);
    selectedIds.value = new Set(visibleIds);
  };

  const clearSelection = () => {
    selectedIds.value = new Set();
  };

  const toggleSelectAll = () => {
    if (allSelected.value) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.value.size === 0) return;

    const idsToDelete = Array.from(selectedIds.value);
    const result = await sdk.backend.deleteTemplates(idsToDelete);

    if (result.kind === "Ok") {
      for (const id of idsToDelete) {
        remove(id);
      }
      selectedIds.value = new Set();
      sdk.window.showToast(`Deleted ${result.value} templates`, {
        variant: "success",
      });
    } else {
      sdk.window.showToast(result.error, { variant: "error" });
    }
  };

  const getSelectedTemplates = () => {
    return data.filter((t) => selectedIds.value.has(t.id));
  };

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
    hasActiveJobs,
    projectID,
    activeTemplateIds,
    httpqlQuery,
    filteredTemplateIds,
    isFiltering,
    filteredData,
    selectedIds,
    hasSelection,
    allSelected,
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
    stopQueue,
    filterByHttpql,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    deleteSelected,
    getSelectedTemplates,
    initialize,
    selectedTemplate,
    orderedResults,
  };
});
