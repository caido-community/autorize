<script setup lang="ts">
import ContextMenu from "primevue/contextmenu";
import { onMounted, ref, toRefs, watch } from "vue";

import { type EditorState } from "../useEditor";

import { useRequestEditor } from "./useRequestEditor";

import { useSDK } from "@/plugins/sdk";

const props = defineProps<{
  editorState: EditorState & { type: "Success" };
}>();

const { editorState } = toRefs(props);
const sdk = useSDK();

const { root, initializeEditor, updateEditorContent, sendToReplay } =
  useRequestEditor(sdk, editorState);

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
  initializeEditor(props.editorState.request.raw);
});

watch(
  () => editorState.value.request.raw,
  (newContent) => {
    updateEditorContent(newContent);
  },
);
</script>

<template>
  <div ref="root" class="h-full" @contextmenu="onRightClick"></div>
  <ContextMenu ref="contextMenu" :model="menuItems" />
</template>
