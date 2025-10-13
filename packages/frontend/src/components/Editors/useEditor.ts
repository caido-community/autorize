import { useAsyncState } from "@vueuse/core";
import { computed, ref } from "vue";

import { useSDK } from "@/plugins/sdk";

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

  const currentRequestId = ref<string | undefined>(undefined);

  const { state, isLoading, error, execute } = useAsyncState(
    async () => {
      const requestID = currentRequestId.value;
      if (requestID === undefined) {
        return undefined;
      }

      const result = await sdk.backend.getRequestResponse(requestID);
      if (result.kind !== "Ok") {
        sdk.window.showToast("Failed to load request", {
          variant: "error",
        });
        throw new Error(result.error);
      }

      return {
        requestID,
        request: {
          id: result.value.request.id,
          raw: result.value.request.raw,
        },
        response: {
          id: result.value.response.id,
          raw: result.value.response.raw,
        },
        connectionInfo: result.value.connectionInfo,
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
