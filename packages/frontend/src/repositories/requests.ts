import { useSDK } from "@/plugins/sdk";

export const useRequestsRepository = () => {
  const sdk = useSDK();

  const getRequestResponse = async (id: string) => {
    const result = await sdk.backend.getRequestResponse(id);
    if (result.kind === "Ok") {
      return {
        type: "Ok" as const,
        data: result.value,
      };
    }
    return {
      type: "Err" as const,
      error: result.error,
    };
  };

  return {
    getRequestResponse,
  };
};
