<script setup lang="ts">
import { type EditorState } from "../useEditor";

import Failed from "./Failed.vue";
import None from "./None.vue";
import Show from "./Show.vue";

defineProps<{
  editorState: EditorState;
}>();
</script>

<template>
  <None v-if="editorState.type === 'None'" />
  <Failed v-else-if="editorState.type === 'Error'" />
  <Show v-else :editor-state="editorState" />
</template>
