<script setup lang="ts">
import { type EditorState } from "../useEditor";

import Failed from "./Failed.vue";
import None from "./None.vue";
import Show from "./Show.vue";
import TooLarge from "./TooLarge.vue";

const { editorState } = defineProps<{
  editorState: EditorState;
}>();
</script>

<template>
  <None v-if="editorState.type === 'None'" />
  <TooLarge v-else-if="editorState.type === 'TooLarge'" />
  <Failed v-else-if="editorState.type === 'Error'" />
  <Show v-else :editor-state="editorState" />
</template>
