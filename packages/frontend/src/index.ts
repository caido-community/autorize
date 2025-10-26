import { Classic } from "@caido/primevue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import Tooltip from "primevue/tooltip";
import { createApp } from "vue";

import { usePageLifecycle } from "./plugins/lifecycle";
import { SDKPlugin } from "./plugins/sdk";
import "./styles/index.css";
import type { FrontendSDK } from "./types";
import App from "./views/App.vue";

import { useConfigStore } from "@/stores/config";

export const init = (sdk: FrontendSDK) => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(PrimeVue, {
    unstyled: true,
    pt: Classic,
  });

  app.directive("tooltip", Tooltip);

  app.use(SDKPlugin, sdk);

  const root = document.createElement("div");
  Object.assign(root.style, {
    height: "100%",
    width: "100%",
  });

  root.id = `plugin--autorize`;

  app.mount(root);

  const lifecycle = usePageLifecycle();

  let sidebarCount = 0;
  sdk.navigation.addPage("/autorize", {
    body: root,
    onEnter: () => {
      sidebarCount = 0;
      sidebarItem.setCount(sidebarCount);
      lifecycle.triggerPageEnter();
    },
  });

  const sidebarItem = sdk.sidebar.registerItem("Autorize", "/autorize", {
    icon: "fas fa-key",
  });

  sdk.commands.register("send-to-autorize", {
    name: "Send Request to Autorize",
    run: async (context) => {
      switch (context.type) {
        case "RequestRowContext": {
          const requestPromises = context.requests.map(async (request) => {
            const result = await sdk.backend.createTemplate(request.id);
            if (result.kind === "Ok") {
              sidebarCount++;
              return { success: true };
            }
            return { success: false, error: result.error };
          });

          const results = await Promise.allSettled(requestPromises);
          const successCount = results.filter(
            (r) => r.status === "fulfilled" && r.value.success,
          ).length;
          const errorCount = results.length - successCount;

          sidebarItem.setCount(sidebarCount);

          if (successCount > 0) {
            sdk.window.showToast(
              `Sent ${successCount} request${
                successCount === 1 ? "" : "s"
              } to Autorize`,
              {
                variant: "success",
              },
            );
          }

          if (errorCount > 0) {
            const firstError = results.find(
              (r) => r.status === "fulfilled" && !r.value.success,
            );
            const errorMessage =
              firstError &&
              firstError.status === "fulfilled" &&
              firstError.value.error !== undefined
                ? firstError.value.error
                : "Some requests failed";
            sdk.window.showToast(errorMessage, {
              variant: "error",
            });
          }
          break;
        }
        default: {
          break;
        }
      }
    },
  });

  sdk.menu.registerItem({
    type: "RequestRow",
    commandId: "send-to-autorize",
    leadingIcon: "fas fa-key",
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: "send-to-autorize",
    leadingIcon: "fas fa-key",
  });

  sdk.commands.register("send-auth-to-autorize", {
    name: "Send Headers to Autorize",
    run: async () => {
      const selection = window.getSelection();
      if (selection === null) {
        sdk.window.showToast("Please select headers to send first", {
          variant: "error",
        });
        return;
      }

      const selectedText = selection.toString();
      if (selectedText === "") {
        sdk.window.showToast("Please select headers to send first", {
          variant: "error",
        });
        return;
      }

      const lines = selectedText
        .split("\n")
        .filter((line) => line.trim() !== "");
      const isHeaders = lines.some((header) => header.includes(":"));

      if (!isHeaders) {
        sdk.window.showToast(
          "Couldn't recognize selection. We currently only support headers.",
          {
            variant: "error",
          },
        );
        return;
      }

      const configStore = useConfigStore();
      if (configStore.data === undefined) {
        sdk.window.showToast("Configuration not loaded yet", {
          variant: "error",
        });
        return;
      }

      const mutations = lines
        .filter((header) => header.includes(":"))
        .map((header) => {
          const colonIndex = header.indexOf(":");
          const key = header.substring(0, colonIndex).trim();
          const value = header.substring(colonIndex + 1).trim();
          return {
            type: "mutated" as const,
            kind: "HeaderReplace" as const,
            header: key,
            value,
          };
        });

      if (mutations.length === 0) {
        sdk.window.showToast("No valid headers found in selection", {
          variant: "error",
        });
        return;
      }

      await configStore.update({ mutations });

      sdk.window.showToast(
        `Added ${mutations.length} header${
          mutations.length === 1 ? "" : "s"
        } to Autorize configuration`,
        { variant: "success" },
      );
    },
  });

  sdk.menu.registerItem({
    type: "Request",
    commandId: "send-auth-to-autorize",
    leadingIcon: "fas fa-key",
  });
};
