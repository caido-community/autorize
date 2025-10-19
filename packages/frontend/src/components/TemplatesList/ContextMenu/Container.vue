<script setup lang="ts">
import ContextMenu from "primevue/contextmenu";
import type { Template } from "shared";
import { ref } from "vue";

import { useTemplatesStore } from "@/stores/templates";

const store = useTemplatesStore();
const menu = ref<InstanceType<typeof ContextMenu>>();

const menuItems = [
  {
    label: "Re-run",
    icon: "fas fa-redo",
    command: () => {
      if (currentTemplate.value !== undefined) {
        store.rerun(currentTemplate.value.id);
      }
    },
  },
  {
    label: "Delete",
    icon: "fas fa-trash",
    command: () => {
      if (currentTemplate.value !== undefined) {
        store.deleteTemplate(currentTemplate.value.id);
      }
    },
  },
];

const currentTemplate = ref<Template | undefined>(undefined);

const show = (event: MouseEvent, template: Template) => {
  currentTemplate.value = template;
  menu.value?.show(event);
};

defineExpose({
  show,
});
</script>

<template>
  <ContextMenu ref="menu" :model="menuItems" />
</template>
