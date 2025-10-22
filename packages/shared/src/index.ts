import { z } from "zod";

const MutationTypeSchema = z.enum(["mutated", "no-auth", "baseline"]);
export type MutationType = z.infer<typeof MutationTypeSchema>;
export const MutationSchema = z.discriminatedUnion("kind", [
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("HeaderAdd"),
    header: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("HeaderRemove"),
    header: z.string().min(1),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("HeaderReplace"),
    header: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("RawMatchAndReplace"),
    match: z.string().min(1),
    value: z.string(),
  }),
]);

export type Mutation = z.infer<typeof MutationSchema>;

export const ConfigSchema = z.object({
  enabled: z.boolean(),
  mutations: z.array(MutationSchema),
  testNoAuth: z.boolean(),
  debug: z.boolean(),
  queue: z.object({
    maxConcurrentRequests: z.number().int().min(1).max(10),
    requestsPerSecond: z.number().int().min(1).max(100),
    requestTimeoutSeconds: z.number().int().min(5).max(300),
  }),
  ui: z.object({
    showOnlyLengths: z.boolean(),
    showFullURL: z.boolean(),
  }),
  passiveFiltering: z.object({
    httpql: z.string(),
    onlyInScope: z.boolean(),
    filters: z.array(z.string()),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const JobSchema = z.object({
  id: z.string(),
  templateId: z.number(),
  baselineRequestId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
});

export type Job = z.infer<typeof JobSchema>;

export const AccessStateSchema = z.object({
  kind: z.enum(["authorized", "unauthorized", "uncertain"]),
  confidence: z.number().min(0).max(1),
});

export type AccessState = z.infer<typeof AccessStateSchema>;

export const JobResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("baseline"),
    request: z.object({
      id: z.string(),
      method: z.string(),
      url: z.url(),
    }),
    response: z.object({
      id: z.string(),
      code: z.number().int().min(100).max(599),
      length: z.number().int().min(0),
    }),
  }),
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("mutated"),
    request: z.object({
      id: z.string(),
      method: z.string(),
      url: z.url(),
    }),
    response: z.object({
      id: z.string(),
      code: z.number().int().min(100).max(599),
      length: z.number().int().min(0),
    }),
    accessState: AccessStateSchema,
  }),
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("no-auth"),
    request: z.object({
      id: z.string(),
      method: z.string(),
      url: z.url(),
    }),
    response: z.object({
      id: z.string(),
      code: z.number().int().min(100).max(599),
      length: z.number().int().min(0),
    }),
    accessState: AccessStateSchema,
  }),
  z.object({
    kind: z.literal("Error"),
    error: z.string(),
  }),
]);

export type JobResult = z.infer<typeof JobResultSchema>;

export const TemplateSchema = z.object({
  id: z.number(),
  key: z.string(),
  request: z.object({
    id: z.string(),
    method: z.string(),
    url: z.url(),
  }),
  results: z.array(JobResultSchema),
});

export type Template = z.infer<typeof TemplateSchema>;

export const APIResultSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("Error"),
      error: z.string(),
    }),
    z.object({
      kind: z.literal("Ok"),
      value: valueSchema,
    }),
  ]);

export type APIResult<T> =
  | { kind: "Error"; error: string }
  | { kind: "Ok"; value: T };
