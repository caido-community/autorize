import { reactive } from "vue";

import { useSDK } from "@/plugins/sdk";
import { useRequestsRepository } from "@/repositories/requests";

export type EditorState =
  | { type: "None" }
  | { type: "Loading"; requestID: string }
  | { type: "Error"; requestID: string; error: string }
  | {
      type: "Success";
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

type Context = {
  state: EditorState;
};

type Message =
  | { type: "Reset" }
  | { type: "Start"; requestID: string }
  | { type: "Error"; requestID: string; error: string }
  | {
      type: "Success";
      requestID: string;
      request: { id: string; raw: string };
      response: { id: string; raw: string };
      connectionInfo: {
        host: string;
        port: number;
        isTLS: boolean;
      };
    };

export const useEditor = () => {
  const sdk = useSDK();
  const repository = useRequestsRepository();

  const context: Context = reactive({
    state: { type: "None" },
  });

  const getState = () => context.state;

  const send = (message: Message) => {
    const currState = context.state;

    switch (currState.type) {
      case "None":
        context.state = processNone(currState, message);
        break;
      case "Loading":
        context.state = processLoading(currState, message);
        break;
      case "Error":
        context.state = processError(currState, message);
        break;
      case "Success":
        context.state = processSuccess(currState, message);
        break;
    }
  };

  const loadRequest = async (requestID: string) => {
    if (!requestID) {
      send({ type: "Reset" });
      return;
    }

    send({ type: "Start", requestID });

    const result = await repository.getRequestResponse(requestID);
    if (result.type !== "Ok") {
      send({ type: "Error", requestID, error: result.error });
      sdk.window.showToast("Failed to load request", {
        variant: "error",
      });
      return;
    }

    send({
      type: "Success",
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
    });
  };

  const reset = () => {
    send({ type: "Reset" });
  };

  return {
    getState,
    loadRequest,
    reset,
  };
};

const processNone = (
  state: EditorState & { type: "None" },
  message: Message,
): EditorState => {
  switch (message.type) {
    case "Start":
      return {
        type: "Loading",
        requestID: message.requestID,
      };
    case "Reset":
    case "Error":
    case "Success":
      return state;
  }
};

const processLoading = (
  state: EditorState & { type: "Loading" },
  message: Message,
): EditorState => {
  switch (message.type) {
    case "Error":
      return {
        type: "Error",
        requestID: message.requestID,
        error: message.error,
      };
    case "Success":
      return {
        type: "Success",
        requestID: message.requestID,
        request: message.request,
        response: message.response,
        connectionInfo: message.connectionInfo,
      };
    case "Reset":
      return { type: "None" };
    case "Start":
      return {
        type: "Loading",
        requestID: message.requestID,
      };
  }
};

const processError = (
  state: EditorState & { type: "Error" },
  message: Message,
): EditorState => {
  switch (message.type) {
    case "Start":
      return {
        type: "Loading",
        requestID: message.requestID,
      };
    case "Reset":
      return { type: "None" };
    case "Error":
    case "Success":
      return state;
  }
};

const processSuccess = (
  state: EditorState & { type: "Success" },
  message: Message,
): EditorState => {
  switch (message.type) {
    case "Start":
      return {
        type: "Loading",
        requestID: message.requestID,
      };
    case "Reset":
      return { type: "None" };
    case "Error":
    case "Success":
      return state;
  }
};
