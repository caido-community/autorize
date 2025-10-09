import { useSDK } from "@/plugins/sdk";

export const useTemplatesRepository = () => {
  const sdk = useSDK();

  const getTemplates = async () => {
    const result = await sdk.backend.getTemplates();
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
        templates: result.value,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const getTemplate = async (id: number) => {
    const result = await sdk.backend.getTemplate(id);
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
        template: result.value,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const deleteTemplate = async (id: number) => {
    const result = await sdk.backend.deleteTemplate(id);
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const rerunTemplate = async (id: number) => {
    const result = await sdk.backend.rerunTemplate(id);
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const clearAllTemplates = async () => {
    const result = await sdk.backend.clearAllTemplates();
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  const rescanAllTemplates = async () => {
    const result = await sdk.backend.rescanAllTemplates();
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  return {
    getTemplates,
    getTemplate,
    deleteTemplate,
    rerunTemplate,
    clearAllTemplates,
    rescanAllTemplates,
  };
};
