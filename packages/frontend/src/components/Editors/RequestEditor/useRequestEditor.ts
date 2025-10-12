import { type EditorView } from "@codemirror/view";
import { useMagicKeys, whenever } from "@vueuse/core";
import { type Ref, ref } from "vue";

import { type EditorState } from "../useEditor";

import { type FrontendSDK } from "@/types";

export const useRequestEditor = (
  sdk: FrontendSDK,
  editorState: Ref<EditorState & { type: "Success" }>,
) => {
  const root = ref<HTMLElement>();
  const editorView = ref<EditorView>();

  const { Meta_r, Ctrl_r } = useMagicKeys();

  const isEditorFocused = () => {
    return editorView.value !== undefined && editorView.value.hasFocus;
  };

  const updateEditorContent = (content: string) => {
    if (editorView.value) {
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: editorView.value.state.doc.length,
          insert: content,
        },
      });
    }
  };

  const sendToReplay = () => {
    sdk.replay.createSession({
      type: "Raw",
      raw: editorState.value.request.raw,
      connectionInfo: {
        host: editorState.value.connectionInfo.host,
        port: editorState.value.connectionInfo.port,
        isTLS: editorState.value.connectionInfo.isTLS,
      },
    });
  };

  const initializeEditor = (initialContent: string) => {
    if (root.value === undefined) {
      return;
    }

    const editor = sdk.ui.httpRequestEditor();
    root.value.appendChild(editor.getElement());
    editorView.value = editor.getEditorView();
    updateEditorContent(initialContent);
  };

  if (Meta_r !== undefined) {
    whenever(Meta_r, () => {
      if (!isEditorFocused()) {
        return;
      }

      sendToReplay();
    });
  }

  if (Ctrl_r !== undefined) {
    whenever(Ctrl_r, () => {
      if (!isEditorFocused()) {
        return;
      }

      sendToReplay();
    });
  }

  return {
    root,
    initializeEditor,
    updateEditorContent,
    sendToReplay,
  };
};
