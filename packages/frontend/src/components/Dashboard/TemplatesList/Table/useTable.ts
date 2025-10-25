import type { JobResult, MutationType, Template } from "shared";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

export const useTable = () => {
  const configStore = useConfigStore();

  const parseURL = (url: string) => {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      pathWithQuery: parsed.pathname + parsed.search,
    };
  };

  const getResultByType = <T extends MutationType>(
    template: Template,
    type: T,
  ): (JobResult & { kind: "Ok"; type: T }) | undefined => {
    return template.results.find(
      (r): r is JobResult & { kind: "Ok"; type: T } =>
        r.kind === "Ok" && r.type === type,
    );
  };

  const getBaselineCode = (template: Template) => {
    const result = getResultByType(template, "baseline");
    return result?.response.code;
  };

  const getBaselineRespLen = (template: Template) => {
    const result = getResultByType(template, "baseline");
    return result?.response.length;
  };

  const getNoAuthCode = (template: Template) => {
    const result = getResultByType(template, "no-auth");
    return result?.response.code;
  };

  const getNoAuthRespLen = (template: Template) => {
    const result = getResultByType(template, "no-auth");
    return result?.response.length;
  };

  const getMutatedCode = (template: Template) => {
    const result = getResultByType(template, "mutated");
    return result?.response.code;
  };

  const getMutatedRespLen = (template: Template) => {
    const result = getResultByType(template, "mutated");
    return result?.response.length;
  };

  const getNoAuthAccessState = (template: Template) => {
    const result = getResultByType(template, "no-auth");
    if (result === undefined) return undefined;

    const labels = configStore.data?.ui.accessStateLabels;
    const state = result.accessState.kind;
    if (state === "unauthorized") return labels?.unauthorized ?? "DENY";
    if (state === "authorized") return labels?.authorized ?? "ALLOW";
    if (state === "uncertain") return labels?.uncertain ?? "UNCERTAIN";
    return undefined;
  };

  const getMutatedAccessState = (template: Template) => {
    const result = getResultByType(template, "mutated");
    if (result === undefined) return undefined;

    const labels = configStore.data?.ui.accessStateLabels;
    const state = result.accessState.kind;
    if (state === "unauthorized") return labels?.unauthorized ?? "DENY";
    if (state === "authorized") return labels?.authorized ?? "ALLOW";
    if (state === "uncertain") return labels?.uncertain ?? "UNCERTAIN";
    return undefined;
  };

  const getAccessStateColor = (state: string | undefined) => {
    if (state === undefined) return undefined;

    const labels = configStore.data?.ui.accessStateLabels;
    if (state === (labels?.unauthorized ?? "DENY"))
      return "rgba(185, 28, 28, 0.6)";
    if (state === (labels?.authorized ?? "ALLOW"))
      return "rgba(15, 110, 50, 0.6)";
    if (state === (labels?.uncertain ?? "UNCERTAIN"))
      return "rgba(217, 119, 6, 0.6)";
    return undefined;
  };

  const getStatusCodeColor = (code: number | undefined) => {
    if (code === undefined) return undefined;

    if (code >= 200 && code < 300) return "#10b981";
    if (code >= 300 && code < 400) return "#3b82f6";
    if (code >= 400 && code < 500) return "#f59e0b";
    if (code >= 500) return "#ef4444";
    return undefined;
  };

  const codeAndLengthColumns = computed(() => {
    const showOnlyLengths = configStore.data?.ui?.showOnlyLengths ?? false;
    const testNoAuth = configStore.data?.testNoAuth ?? true;

    if (showOnlyLengths) {
      const columns = [];

      if (testNoAuth) {
        columns.push({
          field: "noAuthRespLen",
          header: "Unauth. Len",
          getter: getNoAuthRespLen,
        });
      }

      columns.push({
        field: "mutatedRespLen",
        header: "Mutated Len",
        getter: getMutatedRespLen,
      });

      return columns;
    }

    const columns = [];

    if (testNoAuth) {
      columns.push(
        {
          field: "noAuthCode",
          header: "Unauth. Code",
          getter: getNoAuthCode,
          colorGetter: (template: Template) =>
            getStatusCodeColor(getNoAuthCode(template)),
        },
        {
          field: "noAuthRespLen",
          header: "Unauth. Len",
          getter: getNoAuthRespLen,
        },
      );
    }

    columns.push(
      {
        field: "mutatedCode",
        header: "Mutated Code",
        getter: getMutatedCode,
        colorGetter: (template: Template) =>
          getStatusCodeColor(getMutatedCode(template)),
      },
      {
        field: "mutatedRespLen",
        header: "Mutated Len",
        getter: getMutatedRespLen,
      },
    );

    return columns;
  });

  const accessColumns = computed(() => {
    const testNoAuth = configStore.data?.testNoAuth ?? true;
    const columns = [];

    if (testNoAuth) {
      columns.push({
        field: "noAuthAccessState",
        header: "Unauth. Access",
        getter: getNoAuthAccessState,
        colorGetter: (template: Template) =>
          getAccessStateColor(getNoAuthAccessState(template)),
      });
    }

    columns.push({
      field: "mutatedAccessState",
      header: "Mutated Access",
      getter: getMutatedAccessState,
      colorGetter: (template: Template) =>
        getAccessStateColor(getMutatedAccessState(template)),
    });

    return columns;
  });

  return {
    parseURL,
    getBaselineCode,
    getBaselineRespLen,
    getStatusCodeColor,
    codeAndLengthColumns,
    accessColumns,
  };
};
