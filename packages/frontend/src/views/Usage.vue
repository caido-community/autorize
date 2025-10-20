<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <Card
      class="h-fit"
      :pt="{
        body: { class: 'h-fit p-0 flex flex-col' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="p-4">
            <h2 class="text-lg font-semibold">Usage</h2>
            <p class="text-sm text-gray-400">
              Learn how to use Autorize to its full potential
            </p>
          </div>
        </div>
      </template>
    </Card>
    <Card
      class="h-full"
      :pt="{
        body: { class: 'h-fit p-0 flex flex-col' },
        content: { class: 'h-fit flex flex-col' },
      }"
    >
      <template #content> WIP </template>
    </Card>
  </div>
</template>
