<script setup lang="ts">
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { toRef, watch } from "vue";

import { useEditor } from "./useEditor";

import {
  RequestEditor,
  ResponseEditor,
} from "@/components/Dashboard/Preview/Editors";

const { requestId } = defineProps<{
  requestId: string | undefined;
}>();
const editor = useEditor();

watch(
  toRef(() => requestId),
  (newRequestId) => {
    if (newRequestId !== undefined) {
      editor.loadRequest(newRequestId);
    } else {
      editor.reset();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Splitter class="h-full">
    <SplitterPanel :size="50" class="h-full">
      <RequestEditor :editor-state="editor.getState()" />
    </SplitterPanel>
    <SplitterPanel :size="50" class="h-full">
      <ResponseEditor :editor-state="editor.getState()" />
    </SplitterPanel>
  </Splitter>
</template>
