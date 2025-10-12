import type { JobResult, Template } from "shared";
import { computed } from "vue";

import { useConfigStore } from "@/stores/config";

export const useTemplateColumns = () => {
  const configStore = useConfigStore();

  const parseURL = (url: string) => {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      path: parsed.pathname,
      query: parsed.search,
      pathWithQuery: parsed.pathname + parsed.search,
    };
  };

  const getResultByType = (
    template: Template,
    type: "baseline" | "no-auth" | "mutated",
  ): (JobResult & { kind: "Ok" }) | undefined => {
    return template.results.find(
      (r): r is JobResult & { kind: "Ok" } =>
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
    if (result === undefined || result.type !== "no-auth") return undefined;
    const state = result.accessState.kind;
    if (state === "unauthorized") return "DENY";
    if (state === "authorized") return "ALLOW";
    if (state === "uncertain") return "UNCERTAIN";
    return undefined;
  };

  const getMutatedAccessState = (template: Template) => {
    const result = getResultByType(template, "mutated");
    if (result === undefined || result.type !== "mutated") return undefined;
    const state = result.accessState.kind;
    if (state === "unauthorized") return "DENY";
    if (state === "authorized") return "ALLOW";
    if (state === "uncertain") return "UNCERTAIN";
    return undefined;
  };

  const getAccessStateColor = (state: string | undefined) => {
    if (state === undefined) return undefined;

    if (state === "DENY") return "#dc2626";
    if (state === "ALLOW") return "#059669";
    if (state === "UNCERTAIN") return "#d97706";
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
          header: "No-Auth Resp Len",
          getter: getNoAuthRespLen,
        });
      }

      columns.push({
        field: "mutatedRespLen",
        header: "Mutated Resp Len",
        getter: getMutatedRespLen,
      });

      return columns;
    }

    const columns = [];

    if (testNoAuth) {
      columns.push(
        {
          field: "noAuthCode",
          header: "No-Auth Code",
          getter: getNoAuthCode,
        },
        {
          field: "noAuthRespLen",
          header: "No-Auth Resp. Len",
          getter: getNoAuthRespLen,
        },
      );
    }

    columns.push(
      {
        field: "mutatedCode",
        header: "Mutated Code",
        getter: getMutatedCode,
      },
      {
        field: "mutatedRespLen",
        header: "Mutated Resp. Len",
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
        header: "No-Auth Access",
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
    codeAndLengthColumns,
    accessColumns,
  };
};
