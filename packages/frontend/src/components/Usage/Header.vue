<script setup lang="ts">
import Card from "primevue/card";
</script>

<template>
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
            Learn how to use Autorize to test authorization vulnerabilities
          </p>
        </div>
      </div>
    </template>
  </Card>
</template>
