import { type Request, RequestSpecRaw } from "caido:utils";
import { type Job, type JobResult, type Mutation } from "shared";
import { HttpForge } from "ts-http-forge";

import { determineAccessState } from "./comparasion";
import { requestGate } from "./requestGate";
import { requireSDK } from "./sdk";
import { store } from "./store";

export async function* executeJob(job: Job): AsyncGenerator<JobResult> {
  const sdk = requireSDK();
  const state = store.getState();
  const mutations = state.config.mutations;

  const baselineResult = await sdk.requests.get(job.baselineRequestId);
  if (!baselineResult) {
    yield { kind: "Error", error: "Baseline request not found" };
    return;
  }

  if (!baselineResult.response) {
    yield { kind: "Error", error: "Baseline response not found" };
    return;
  }

  const rawBaseline = baselineResult.request.getRaw().toText();
  const mutatedRawRequest = applyMutations(rawBaseline, mutations);
  const mutatedRequest = buildRequestSpecRaw(
    mutatedRawRequest,
    baselineResult.request,
  );

  const mutatedResult = await requestGate.wrapSend(mutatedRequest);
  if (mutatedResult.kind === "Error") {
    yield { kind: "Error", error: mutatedResult.error };
    return;
  }

  if (mutatedResult.value.response === undefined) {
    yield { kind: "Error", error: "Mutated response not found" };
    return;
  }

  const accessState = determineAccessState(
    baselineResult.response,
    mutatedResult.value.response,
  );

  yield {
    kind: "Ok",
    type: "mutated",
    request: {
      id: mutatedResult.value.request.getId(),
      method: mutatedResult.value.request.getMethod(),
      url: mutatedResult.value.request.getUrl(),
    },
    response: {
      id: mutatedResult.value.response.getId(),
      code: mutatedResult.value.response.getCode(),
      length: mutatedResult.value.response.getRaw().toText().length,
    },
    accessState,
  };

  if (state.config.testNoAuth) {
    const noAuthRequest = buildRequestSpecRaw(
      removeAuthHeaders(rawBaseline),
      baselineResult.request,
    );
    const noAuthResult = await requestGate.wrapSend(noAuthRequest);

    if (noAuthResult.kind === "Error") {
      yield { kind: "Error", error: noAuthResult.error };
      return;
    }

    const noAuthAccessState = determineAccessState(
      baselineResult.response,
      noAuthResult.value.response,
    );

    yield {
      kind: "Ok",
      type: "no-auth",
      request: {
        id: noAuthResult.value.request.getId(),
        method: noAuthResult.value.request.getMethod(),
        url: noAuthResult.value.request.getUrl(),
      },
      response: {
        id: noAuthResult.value.response.getId(),
        code: noAuthResult.value.response.getCode(),
        length: noAuthResult.value.response.getRaw().toText().length,
      },
      accessState: noAuthAccessState,
    };
  }
}

function applyMutations(raw: string, mutations: Mutation[]): string {
  let forge = HttpForge.create(raw);

  for (const mutation of mutations) {
    forge = applyMutation(forge, mutation);
  }

  return forge.build();
}

function applyMutation(
  forge: ReturnType<typeof HttpForge.create>,
  mutation: Mutation,
) {
  switch (mutation.kind) {
    case "HeaderAdd":
      return forge.addHeader(mutation.header, mutation.value);
    case "HeaderRemove":
      return forge.removeHeader(mutation.header);
    case "HeaderReplace":
      return forge.setHeader(mutation.header, mutation.value);
    case "RawMatchAndReplace":
      const newRaw = forge.build().replaceAll(mutation.match, mutation.value);
      return HttpForge.create(newRaw).removeHeader("Content-Length");
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

function buildRequestSpecRaw(raw: string, baseline: Request): RequestSpecRaw {
  const url = `${
    baseline.getTls() ? "https" : "http"
  }://${baseline.getHost()}:${baseline.getPort()}${baseline.getPath()}${baseline.getQuery()}`;
  const request = new RequestSpecRaw(url);
  request.setRaw(raw);
  return request;
}
