<script setup lang="ts">
import Card from "primevue/card";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import ToggleSwitch from "primevue/toggleswitch";
import type { ReauthRequest, SessionManagement } from "shared";
import { computed, onMounted, ref, watch } from "vue";

import CreateTokenExtraction from "./CreateTokenExtraction.vue";
import RawHttpEditor from "./RawHttpEditor.vue";
import TokenExtractionsTable from "./TokenExtractionsTable.vue";

import { useConfigStore } from "@/stores/config";

const configStore = useConfigStore();

const userProfiles = computed(() => configStore.data?.userProfiles ?? []);
const isPluginEnabled = computed(() => configStore.data?.enabled ?? false);

const selectedProfileId = ref<string | undefined>(undefined);

const profileOptions = computed(() =>
  userProfiles.value.map((p) => ({
    label: p.name,
    value: p.id,
  })),
);

const selectedProfile = computed(() =>
  userProfiles.value.find((p) => p.id === selectedProfileId.value),
);

const sessionConfig = computed(() => selectedProfile.value?.sessionManagement);

const isEnabled = computed(() => sessionConfig.value?.enabled === true);

const reauthRequest = computed<ReauthRequest>(
  () =>
    sessionConfig.value?.reauthRequest ?? {
      raw: "",
      tls: true,
    },
);

const getDefaultSessionConfig = (): SessionManagement => ({
  enabled: true,
  invalidSessionHttpql: "",
  reauthRequest: { raw: "", tls: true },
  tokenExtractions: [],
  maxRetries: 1,
});

const updateSessionConfig = async (updates: Partial<SessionManagement>) => {
  if (selectedProfileId.value === undefined) return;
  const current = sessionConfig.value ?? getDefaultSessionConfig();
  const updated = { ...current, ...updates };

  await configStore.update({
    userProfiles: userProfiles.value.map((p) =>
      p.id === selectedProfileId.value
        ? { ...p, sessionManagement: updated }
        : p,
    ),
  });
};

const updateReauthRequest = async (updates: Partial<ReauthRequest>) => {
  await updateSessionConfig({
    reauthRequest: { ...reauthRequest.value, ...updates },
  });
};

const handleToggleEnabled = async (enabled: boolean) => {
  await updateSessionConfig({ enabled });
};

const handleHttpqlBlur = (event: FocusEvent) => {
  const target = event.target as HTMLInputElement;
  updateSessionConfig({ invalidSessionHttpql: target.value });
};

const handleRawUpdate = (value: string) => {
  updateReauthRequest({ raw: value });
};

const handleTlsToggle = (value: boolean) => {
  updateReauthRequest({ tls: value });
};

const handleMaxRetriesUpdate = (value: number) => {
  updateSessionConfig({ maxRetries: Math.min(3, Math.max(1, value)) });
};

onMounted(() => {
  if (userProfiles.value.length > 0) {
    selectedProfileId.value = userProfiles.value[0]?.id;
  }
});

watch(userProfiles, (profiles) => {
  if (
    profiles.length > 0 &&
    !profiles.some((p) => p.id === selectedProfileId.value)
  ) {
    selectedProfileId.value = profiles[0]?.id;
  }
});
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-4 flex flex-col' },
      content: { class: 'h-full flex flex-col min-h-0' },
    }"
  >
    <template #content>
      <div class="flex justify-between items-start mb-4">
        <div class="flex-1">
          <h3 class="text-md font-semibold">Session Management</h3>
          <p class="text-sm text-surface-400">
            Configure automatic re-authentication when a session expires.
          </p>
        </div>
        <Select
          v-model="selectedProfileId"
          :options="profileOptions"
          option-label="label"
          option-value="value"
          placeholder="Select profile"
          class="w-40"
        />
      </div>

      <template v-if="selectedProfile">
        <div class="flex items-center justify-between mb-3">
          <div>
            <label class="text-sm font-medium">
              Enable Session Management
            </label>
            <p class="text-sm text-surface-400">
              Automatically re-authenticate when session expires
            </p>
          </div>
          <ToggleSwitch
            :model-value="isEnabled"
            :disabled="isPluginEnabled"
            @update:model-value="handleToggleEnabled"
          />
        </div>

        <template v-if="isEnabled">
          <div class="space-y-3 mb-3 overflow-hidden">
            <div>
              <label class="text-sm font-medium block">
                Invalid Session Condition
              </label>
              <p class="text-sm text-surface-400 mb-1">
                HTTPQL query that matches when the session is invalid
              </p>
              <InputText
                :model-value="sessionConfig?.invalidSessionHttpql ?? ''"
                :disabled="isPluginEnabled"
                placeholder='e.g. res.code = 401 OR res.body.cont:"session expired"'
                class="w-full font-mono text-sm"
                @blur="handleHttpqlBlur"
              />
            </div>

            <div>
              <label class="text-sm font-medium block">
                Re-authentication Request
              </label>
              <p class="text-sm text-surface-400 mb-1">
                Raw HTTP request to refresh the session. Supports
                <code v-pre class="text-xs">{{ VAR_NAME }}</code> for
                environment variables.
              </p>
              <RawHttpEditor
                :model-value="reauthRequest.raw"
                :disabled="isPluginEnabled"
                @update:model-value="handleRawUpdate"
              />
            </div>

            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium">TLS (HTTPS)</label>
                <p class="text-sm text-surface-400">
                  Use HTTPS when sending the re-authentication request
                </p>
              </div>
              <ToggleSwitch
                :model-value="reauthRequest.tls"
                :disabled="isPluginEnabled"
                @update:model-value="handleTlsToggle"
              />
            </div>

            <div class="flex items-center justify-between gap-4">
              <div class="flex-1">
                <label class="text-sm font-medium">Max Retries</label>
                <p class="text-sm text-surface-400">
                  Number of re-authentication attempts before giving up
                </p>
              </div>
              <div class="flex-shrink-0">
                <InputNumber
                  :model-value="sessionConfig?.maxRetries ?? 1"
                  :min="1"
                  :max="3"
                  :disabled="isPluginEnabled"
                  show-buttons
                  :pt="{ root: { style: 'width: 100%;' } }"
                  @update:model-value="handleMaxRetriesUpdate"
                />
              </div>
            </div>
          </div>

          <div class="flex-1 min-h-0 flex flex-col gap-3">
            <TokenExtractionsTable
              class="flex-1"
              :profile-id="selectedProfile.id"
              :disabled="isPluginEnabled"
            />
            <CreateTokenExtraction
              :disabled="isPluginEnabled"
              :profile-id="selectedProfile.id"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <div class="text-center py-8 text-surface-400">
          No user profiles configured. Add a profile in the Mutations tab first.
        </div>
      </template>
    </template>
  </Card>
</template>
