<script setup lang="ts">
import { computed } from "vue";

import { useSDK } from "@/plugins/sdk";

const props = defineProps<{
  value: string;
}>();

const sdk = useSDK();

type TextPart = { type: "text" | "env"; content: string };

const parts = computed<TextPart[]>(() => {
  const envVarPattern = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const result: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | undefined;

  while ((match = envVarPattern.exec(props.value) ?? undefined) !== undefined) {
    if (match.index > lastIndex) {
      result.push({
        type: "text",
        content: props.value.slice(lastIndex, match.index),
      });
    }

    result.push({
      type: "env",
      content: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < props.value.length) {
    result.push({
      type: "text",
      content: props.value.slice(lastIndex),
    });
  }

  return result;
});

const handleEnvClick = () => {
  sdk.navigation.goTo("/environment");
};
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <template v-for="(part, index) in parts" :key="index">
      <span v-if="part.type === 'text'">{{ part.content }}</span>
      <span
        v-else
        class="px-1.5 py-0.5 bg-surface-500/30 text-surface-200 rounded text-xs font-mono border border-surface-500/30 hover:bg-surface-500/50 cursor-pointer transition-colors"
        @click="handleEnvClick"
      >
        {{ part.content }}
      </span>
    </template>
  </span>
</template>
