import { type Request, RequestSpecRaw } from "caido:utils";
import {
  type Job,
  type JobResult,
  type Mutation,
  type ProfileMutation,
} from "shared";
import { HttpForge } from "ts-http-forge";

import { requireSDK } from "../sdk";
import { configStore } from "../stores/config";

import { determineAccessState } from "./comparasion";
import { requestGate } from "./requests-gate";

type TestRequest =
  | {
      type: "mutated";
      userProfileId?: string;
      userProfileName?: string;
      raw: string;
    }
  | { type: "no-auth"; raw: string };

export async function* executeJob(job: Job): AsyncGenerator<JobResult> {
  const sdk = requireSDK();
  const config = configStore.getConfig();

  const originalRequest = await sdk.requests.get(job.baselineRequestId);
  if (!originalRequest) {
    yield { kind: "Error", error: "Baseline request not found" };
    return;
  }

  let baselineRaw = originalRequest.request.getRaw().toText();

  const baselineMutations = config.mutations.filter(
    (m) => m.type === "baseline",
  );
  if (baselineMutations.length > 0) {
    baselineRaw = applyMutations(baselineRaw, baselineMutations);
  }

  const baselineSpec = buildRequestSpec(baselineRaw, originalRequest.request);

  const baselineResult = await requestGate.wrapSend(baselineSpec);
  if (baselineResult.kind === "Error") {
    yield { kind: "Error", error: baselineResult.error };
    return;
  }

  if (baselineResult.value.response === undefined) {
    yield { kind: "Error", error: "Baseline response not found" };
    return;
  }

  yield {
    kind: "Ok",
    type: "baseline",
    request: {
      id: baselineResult.value.request.getId(),
      method: baselineResult.value.request.getMethod(),
      url: baselineResult.value.request.getUrl(),
    },
    response: {
      id: baselineResult.value.response.getId(),
      code: baselineResult.value.response.getCode(),
      length: baselineResult.value.response.getRaw().toText().length,
    },
  };

  const testRequests: TestRequest[] = [];

  const enabledProfiles = config.userProfiles?.filter((p) => p.enabled) ?? [];

  for (const profile of enabledProfiles) {
    testRequests.push({
      type: "mutated",
      userProfileId: profile.id,
      userProfileName: profile.name,
      raw: applyProfileMutations(baselineRaw, profile.mutations),
    });
  }

  const noauthMutations = config.mutations.filter((m) => m.type === "no-auth");
  if (config.testNoAuth) {
    if (noauthMutations.length > 0) {
      testRequests.push({
        type: "no-auth",
        raw: removeAuthHeaders(applyMutations(baselineRaw, noauthMutations)),
      });
    } else {
      testRequests.push({
        type: "no-auth",
        raw: removeAuthHeaders(baselineRaw),
      });
    }
  }

  const testPromises = testRequests.map(async (testReq) => {
    const spec = buildRequestSpec(testReq.raw, originalRequest.request);
    const result = await requestGate.wrapSend(spec);
    return { testReq, result };
  });

  for (const promise of testPromises) {
    const { testReq, result } = await promise;

    if (result.kind === "Error") {
      yield { kind: "Error", error: result.error };
      continue;
    }

    if (result.value.response === undefined) {
      yield { kind: "Error", error: `${testReq.type} response not found` };
      continue;
    }

    const baselineResponse = baselineResult.value.response;
    const mutatedResponse = result.value.response;

    let accessState = determineAccessState(baselineResponse, mutatedResponse);

    const authorizedHttpql = config.statusDetection.authorizedHttpql;
    const unauthorizedHttpql = config.statusDetection.unauthorizedHttpql;

    if (unauthorizedHttpql !== "") {
      const matchesUnauthorized = sdk.requests.matches(
        unauthorizedHttpql,
        originalRequest.request,
        mutatedResponse,
      );
      if (matchesUnauthorized) {
        accessState = { kind: "unauthorized", confidence: 1 };
      }
    }

    if (authorizedHttpql !== "") {
      const matchesAuthorized = sdk.requests.matches(
        authorizedHttpql,
        originalRequest.request,
        mutatedResponse,
      );

      if (matchesAuthorized) {
        accessState = { kind: "authorized", confidence: 1 };
      }
    }

    if (testReq.type === "mutated") {
      yield {
        kind: "Ok",
        type: "mutated",
        userProfileId: testReq.userProfileId,
        userProfileName: testReq.userProfileName,
        request: {
          id: result.value.request.getId(),
          method: result.value.request.getMethod(),
          url: result.value.request.getUrl(),
        },
        response: {
          id: result.value.response.getId(),
          code: result.value.response.getCode(),
          length: result.value.response.getRaw().toText().length,
        },
        accessState,
      };
    } else {
      yield {
        kind: "Ok",
        type: "no-auth",
        request: {
          id: result.value.request.getId(),
          method: result.value.request.getMethod(),
          url: result.value.request.getUrl(),
        },
        response: {
          id: result.value.response.getId(),
          code: result.value.response.getCode(),
          length: result.value.response.getRaw().toText().length,
        },
        accessState,
      };
    }
  }
}

function resolveEnvVariables(value: string): string {
  const sdk = requireSDK();
  const envVarPattern = /{{\s*([A-Za-z0-9_]+)\s*}}/g;

  return value.replace(envVarPattern, (match, varName) => {
    const envValue = sdk.env.getVar(varName);
    return envValue ?? match;
  });
}

function applyMutations(raw: string, mutations: Mutation[]): string {
  let forge = HttpForge.create(raw);

  for (const mutation of mutations) {
    forge = applyMutation(forge, mutation);
  }

  return forge.build();
}

function applyProfileMutations(
  raw: string,
  mutations: ProfileMutation[],
): string {
  let forge = HttpForge.create(raw);

  for (const mutation of mutations) {
    forge = applyProfileMutation(forge, mutation);
  }

  return forge.build();
}

function applyProfileMutation(
  forge: ReturnType<typeof HttpForge.create>,
  mutation: ProfileMutation,
) {
  switch (mutation.kind) {
    case "HeaderAdd":
      return forge.addHeader(
        mutation.header,
        resolveEnvVariables(mutation.value),
      );
    case "HeaderRemove":
      return forge.removeHeader(mutation.header);
    case "HeaderReplace":
      return forge.setHeader(
        mutation.header,
        resolveEnvVariables(mutation.value),
      );
    case "CookieAdd":
      return forge.addCookie(
        mutation.cookie,
        resolveEnvVariables(mutation.value),
      );
    case "CookieRemove":
      return forge.removeCookie(mutation.cookie);
    case "CookieReplace":
      return forge.setCookie(
        mutation.cookie,
        resolveEnvVariables(mutation.value),
      );
    case "RawMatchAndReplace": {
      const resolvedMatch = resolveEnvVariables(mutation.match);
      const resolvedValue = resolveEnvVariables(mutation.value);
      const rawStr = forge.build();
      let newRaw: string;

      if (mutation.regex === true) {
        try {
          newRaw = rawStr.replace(
            new RegExp(resolvedMatch, "g"),
            resolvedValue,
          );
        } catch {
          newRaw = rawStr;
        }
      } else {
        newRaw = rawStr.replaceAll(resolvedMatch, resolvedValue);
      }

      const body = newRaw.slice(newRaw.indexOf("\r\n\r\n") + 4);
      return HttpForge.create(newRaw).setHeader(
        "Content-Length",
        body.length.toString(),
      );
    }
  }
}

function applyMutation(
  forge: ReturnType<typeof HttpForge.create>,
  mutation: Mutation,
) {
  switch (mutation.kind) {
    case "HeaderAdd":
      return forge.addHeader(
        mutation.header,
        resolveEnvVariables(mutation.value),
      );
    case "HeaderRemove":
      return forge.removeHeader(mutation.header);
    case "HeaderReplace":
      return forge.setHeader(
        mutation.header,
        resolveEnvVariables(mutation.value),
      );
    case "CookieAdd":
      return forge.addCookie(
        mutation.cookie,
        resolveEnvVariables(mutation.value),
      );
    case "CookieRemove":
      return forge.removeCookie(mutation.cookie);
    case "CookieReplace":
      return forge.setCookie(
        mutation.cookie,
        resolveEnvVariables(mutation.value),
      );
    case "RawMatchAndReplace": {
      const resolvedMatch = resolveEnvVariables(mutation.match);
      const resolvedValue = resolveEnvVariables(mutation.value);
      const raw = forge.build();
      let newRaw: string;

      if (mutation.regex === true) {
        try {
          newRaw = raw.replace(new RegExp(resolvedMatch, "g"), resolvedValue);
        } catch {
          newRaw = raw;
        }
      } else {
        newRaw = raw.replaceAll(resolvedMatch, resolvedValue);
      }

      const body = newRaw.slice(newRaw.indexOf("\r\n\r\n") + 4);
      return HttpForge.create(newRaw).setHeader(
        "Content-Length",
        body.length.toString(),
      );
    }
  }
}

function removeAuthHeaders(raw: string): string {
  const authHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
    "x-csrf-token",
    "x-xsrf-token",
    "csrf-token",
  ];
  let forge = HttpForge.create(raw);

  for (const header of authHeaders) {
    forge = forge.removeHeader(header);
  }

  return forge.build();
}

function buildRequestSpec(raw: string, request: Request): RequestSpecRaw {
  const protocol = request.getTls() ? "https" : "http";
  const url = `${protocol}://${request.getHost()}:${request.getPort()}${request.getPath()}${request.getQuery()}`;
  const spec = new RequestSpecRaw(url);
  spec.setRaw(raw);
  return spec;
}
