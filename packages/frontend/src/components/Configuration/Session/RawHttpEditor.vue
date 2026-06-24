<script setup lang="ts">
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
  lineNumbers,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const { modelValue, disabled } = defineProps<{
  modelValue: string;
  disabled: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const container = ref<HTMLElement>();
let view: EditorView | undefined;
let internalUpdate = false;

const theme = EditorView.theme({
  "&": {
    fontSize: "12px",
    border: "1px solid var(--p-surface-700)",
    borderRadius: "6px",
    backgroundColor: "var(--p-surface-900)",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-content": {
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    padding: "8px 0",
    caretColor: "#e4e4ef",
    color: "#e4e4ef",
  },
  ".cm-line": {
    padding: "0 8px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--p-surface-800)",
    color: "var(--p-surface-400)",
    border: "none",
    borderRadius: "6px 0 0 6px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "var(--p-surface-700)",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  ".cm-cursor": {
    borderLeftColor: "#e4e4ef",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(100, 130, 255, 0.25) !important",
  },
  ".cm-env-var": {
    backgroundColor:
      "color-mix(in srgb, var(--p-surface-500) 30%, transparent)",
    color: "var(--p-surface-200)",
    border:
      "1px solid color-mix(in srgb, var(--p-surface-500) 30%, transparent)",
    borderRadius: "3px",
    padding: "0 3px",
  },
});

const envVarMatcher = new MatchDecorator({
  regexp: /\{\{\s*[A-Za-z0-9_]+\s*\}\}/g,
  decoration: Decoration.mark({ class: "cm-env-var" }),
});

const envVarHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = envVarMatcher.createDeco(view);
    }

    update(update: ViewUpdate) {
      this.decorations = envVarMatcher.updateDeco(update, this.decorations);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

const buildExtensions = (editable: boolean) => [
  lineNumbers(),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  theme,
  envVarHighlighter,
  EditorView.lineWrapping,
  EditorView.editable.of(editable),
  EditorView.domEventHandlers({
    blur() {
      if (view === undefined) return;
      emit("update:modelValue", view.state.doc.toString());
    },
  }),
];

onMounted(() => {
  if (container.value === undefined) return;

  view = new EditorView({
    state: EditorState.create({
      doc: modelValue,
      extensions: buildExtensions(!disabled),
    }),
    parent: container.value,
  });
});

onBeforeUnmount(() => {
  view?.destroy();
  view = undefined;
});

watch(
  () => disabled,
  () => {
    if (view === undefined) return;
    const content = view.state.doc.toString();
    view.setState(
      EditorState.create({
        doc: content,
        extensions: buildExtensions(!disabled),
      }),
    );
  },
);

watch(
  () => modelValue,
  (newVal) => {
    if (view === undefined || internalUpdate) return;
    const current = view.state.doc.toString();
    if (current !== newVal) {
      internalUpdate = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: newVal },
      });
      internalUpdate = false;
    }
  },
);
</script>

<template>
  <div ref="container" class="raw-http-editor" />
</template>

<style scoped>
.raw-http-editor {
  min-height: 180px;
  max-height: 300px;
  overflow: auto;
}

.raw-http-editor :deep(.cm-editor) {
  min-height: 180px;
}
</style>
