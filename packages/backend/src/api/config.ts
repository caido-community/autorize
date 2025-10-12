import { type APIResult, type Config, ConfigSchema } from "shared";

import { configStore } from "../stores/config";
import { type BackendSDK } from "../types";

export function updateConfig(
  _sdk: BackendSDK,
  _config: Partial<Config>,
): APIResult<void> {
  const result = ConfigSchema.partial().safeParse(_config);
  if (!result.success) {
    return {
      kind: "Error",
      error: "Invalid input parameters.",
    };
  }

  const config = configStore.getConfig();
  const nonEnabledFields = Object.keys(_config).filter(
    (key) => key !== "enabled" && key !== "ui",
  );
  if (config.enabled && nonEnabledFields.length > 0) {
    return {
      kind: "Error",
      error:
        "Cannot modify configuration while plugin is enabled. Disable first.",
    };
  }

  if (_config.enabled === true && config.mutations.length === 0) {
    return {
      kind: "Error",
      error:
        "Cannot enable plugin without second-user authorization mutations configured.",
    };
  }

  configStore.updateConfig(_config);
  return { kind: "Ok", value: undefined };
}

export function getConfig(_sdk: BackendSDK): APIResult<Config> {
  return { kind: "Ok", value: configStore.getConfig() };
}
