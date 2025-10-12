import { useAsyncState } from "@vueuse/core";
import { computed, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useRequestsRepository } from "@/repositories/requests";

export type EditorData = {
  requestID: string;
  request: {
    id: string;
    raw: string;
  };
  response: {
    id: string;
    raw: string;
  };
  connectionInfo: {
    host: string;
    port: number;
    isTLS: boolean;
  };
};

export type EditorState =
  | { type: "None" }
  | { type: "Loading" }
  | { type: "Error" }
  | ({ type: "Success" } & EditorData);

export const useEditor = () => {
  const sdk = useSDK();
  const repository = useRequestsRepository();

  const currentRequestId = ref<string | undefined>(undefined);

  const { state, isLoading, error, execute } = useAsyncState(
    async () => {
      const requestID = currentRequestId.value;
      if (requestID === undefined) {
        return undefined;
      }

      const result = await repository.getRequestResponse(requestID);
      if (result.type !== "Ok") {
        sdk.window.showToast("Failed to load request", {
          variant: "error",
        });
        throw new Error(result.error);
      }

      return {
        requestID,
        request: {
          id: result.data.request.id,
          raw: result.data.request.raw,
        },
        response: {
          id: result.data.response.id,
          raw: result.data.response.raw,
        },
        connectionInfo: result.data.connectionInfo,
      };
    },
    undefined,
    { immediate: false },
  );

  const editorState = computed<EditorState>(() => {
    if (currentRequestId.value === undefined) {
      return { type: "None" };
    }

    if (isLoading.value) {
      return { type: "Loading" };
    }

    if (error.value !== undefined) {
      return { type: "Error" };
    }

    if (state.value !== undefined) {
      return {
        type: "Success",
        ...state.value,
      };
    }

    return { type: "None" };
  });

  const getState = () => editorState.value;

  const loadRequest = (requestID: string) => {
    currentRequestId.value = requestID;
    execute();
  };

  const reset = () => {
    currentRequestId.value = undefined;
  };

  return {
    getState,
    loadRequest,
    reset,
  };
};
