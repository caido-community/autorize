<script setup lang="ts">
import ContextMenu from "primevue/contextmenu";
import { onMounted, ref, toRef, watch } from "vue";

import { type EditorState } from "../useEditor";

import { useRequestEditor } from "./useRequestEditor";

import { useSDK } from "@/plugins/sdk";

const { editorState } = defineProps<{
  editorState: EditorState & { type: "Success" };
}>();
const sdk = useSDK();

const root = ref<HTMLElement>();
const { initializeEditor, updateEditorContent, sendToReplay } =
  useRequestEditor(
    sdk,
    toRef(() => editorState),
    root,
  );

const contextMenu = ref();

const menuItems = [
  {
    label: "Send to Replay",
    icon: "fas fa-play",
    command: sendToReplay,
  },
];

const onRightClick = (event: MouseEvent) => {
  contextMenu.value.show(event);
};

onMounted(() => {
  initializeEditor(editorState.request.raw);
});

watch(
  () => editorState.request.raw,
  (newContent) => {
    updateEditorContent(newContent);
  },
);
</script>

<template>
  <div ref="root" class="h-full" @contextmenu="onRightClick"></div>
  <ContextMenu ref="contextMenu" :model="menuItems" />
</template>
