import { type APIResult, type Config, ConfigSchema } from "shared";

import { configStore } from "../stores/config";
import { type BackendSDK } from "../types";
import { debugLog } from "../utils";

export function updateConfig(
  _sdk: BackendSDK,
  _config: Partial<Config>,
): APIResult<void> {
  debugLog("updateConfig API called with:", _config);

  const result = ConfigSchema.partial().safeParse(_config);
  if (!result.success) {
    debugLog("updateConfig validation failed");
    return {
      kind: "Error",
      error: "Invalid input parameters.",
    };
  }

  const config = configStore.getConfig();
  const nonEnabledFields = Object.keys(_config).filter(
    (key) => key !== "enabled" && key !== "ui" && key !== "debug",
  );
  if (config.enabled && nonEnabledFields.length > 0) {
    debugLog(
      "updateConfig rejected: trying to modify config while enabled:",
      nonEnabledFields,
    );
    return {
      kind: "Error",
      error:
        "Cannot modify configuration while plugin is enabled. Disable first.",
    };
  }

  const anyEnabledProfiles =
    config.userProfiles?.some((p) => p.enabled) ?? false;
  if (_config.enabled === true && !anyEnabledProfiles) {
    debugLog("updateConfig rejected: no user profiles configured");
    return {
      kind: "Error",
      error:
        "Cannot enable plugin without a user profile. Add one in the Mutations tab.",
    };
  }

  configStore.updateConfig(_config);
  debugLog("Config updated successfully");
  return { kind: "Ok", value: undefined };
}

export function getConfig(_sdk: BackendSDK): APIResult<Config> {
  return { kind: "Ok", value: configStore.getConfig() };
}
