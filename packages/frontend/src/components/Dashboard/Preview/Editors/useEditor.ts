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
  | { type: "Error" }
  | { type: "TooLarge" }
  | ({ type: "Success" } & EditorData);

const MAX_RESPONSE_SIZE = 6 * 1024 * 1024;

export const useEditor = () => {
  const sdk = useSDK();

  const currentRequestId = ref<string | undefined>(undefined);
  const lastSuccessfulState = ref<EditorData | undefined>(undefined);
  const isTooLarge = ref(false);

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

      const responseSize = result.value.response.raw.length;
      if (responseSize > MAX_RESPONSE_SIZE) {
        isTooLarge.value = true;
        return undefined;
      }

      isTooLarge.value = false;
      const data = {
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

      lastSuccessfulState.value = data;
      return data;
    },
    undefined,
    { immediate: false },
  );

  const editorState = computed<EditorState>(() => {
    if (currentRequestId.value === undefined) {
      return { type: "None" };
    }

    if (isTooLarge.value && !isLoading.value) {
      return { type: "TooLarge" };
    }

    if (error.value !== undefined && !isLoading.value) {
      return { type: "Error" };
    }

    if (state.value !== undefined) {
      return {
        type: "Success",
        ...state.value,
      };
    }

    if (lastSuccessfulState.value !== undefined) {
      return {
        type: "Success",
        ...lastSuccessfulState.value,
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
    lastSuccessfulState.value = undefined;
    isTooLarge.value = false;
  };

  return {
    getState,
    loadRequest,
    reset,
  };
};
