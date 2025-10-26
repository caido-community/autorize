<script setup lang="ts">
import { type EditorView } from "@codemirror/view";
import { onMounted, ref, toRefs, watch } from "vue";

import { type EditorState } from "../useEditor";

import { usePageLifecycle } from "@/plugins/lifecycle";
import { useSDK } from "@/plugins/sdk";

const props = defineProps<{
  editorState: EditorState & { type: "Success" };
}>();

const { editorState } = toRefs(props);
const sdk = useSDK();

const root = ref();
let editorView: EditorView | undefined = undefined;

const updateEditorContent = (content: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    });
  }
};

const initializeEditor = () => {
  const editor = sdk.ui.httpResponseEditor();
  if (root.value === undefined) {
    return;
  }

  root.value.appendChild(editor.getElement());
  editorView = editor.getEditorView();
  updateEditorContent(props.editorState.response.raw);
};

onMounted(() => {
  initializeEditor();
});

watch(
  () => editorState.value.response.raw,
  (newContent) => {
    updateEditorContent(newContent);
  },
);

// for some reason once we switch between pages, the editor breaks and we need to reinitialize it, this is a workaround to fix it
const lifecycle = usePageLifecycle();
watch(lifecycle.getPageEnterCounter(), () => {
  editorView = undefined;

  setTimeout(() => {
    Array.from(root.value?.children ?? []).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.remove();
      }
    });

    initializeEditor();
  }, 0);
});
</script>

<template>
  <div ref="root" class="h-full"></div>
</template>
