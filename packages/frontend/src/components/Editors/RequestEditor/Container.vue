<script setup lang="ts">
import { type EditorState } from "../useEditor";

import Failed from "./Failed.vue";
import Loading from "./Loading.vue";
import None from "./None.vue";
import Show from "./Show.vue";

defineProps<{
  editorState: EditorState;
}>();
</script>

<template>
  <None v-if="editorState.type === 'None'" />
  <Loading v-else-if="editorState.type === 'Loading'" />
  <Failed v-else-if="editorState.type === 'Error'" />
  <Show v-else :editor-state="editorState" />
</template>
