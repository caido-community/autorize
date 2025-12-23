import { z } from "zod";

const MutationTypeSchema = z.enum(["no-auth", "baseline"]);
export type MutationType = z.infer<typeof MutationTypeSchema>;

export type ResultType = "baseline" | "mutated" | "no-auth";

export const ProfileMutationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("HeaderAdd"),
    header: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("HeaderRemove"),
    header: z.string().min(1),
  }),
  z.object({
    kind: z.literal("HeaderReplace"),
    header: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("CookieAdd"),
    cookie: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("CookieRemove"),
    cookie: z.string().min(1),
  }),
  z.object({
    kind: z.literal("CookieReplace"),
    cookie: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("RawMatchAndReplace"),
    match: z.string().min(1),
    value: z.string(),
    regex: z.boolean(),
  }),
]);

export type ProfileMutation = z.infer<typeof ProfileMutationSchema>;

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
    kind: z.literal("CookieAdd"),
    cookie: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("CookieRemove"),
    cookie: z.string().min(1),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("CookieReplace"),
    cookie: z.string().min(1),
    value: z.string(),
  }),
  z.object({
    type: MutationTypeSchema,
    kind: z.literal("RawMatchAndReplace"),
    match: z.string().min(1),
    value: z.string(),
    regex: z.boolean(),
  }),
]);

export type Mutation = z.infer<typeof MutationSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  enabled: z.boolean(),
  mutations: z.array(ProfileMutationSchema),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const ConfigSchema = z.object({
  enabled: z.boolean(),
  mutations: z.array(MutationSchema),
  userProfiles: z.array(UserProfileSchema),
  multiUserMode: z.boolean(),
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
    editorsLayout: z.enum(["tabs", "vertical"]),
    accessStateLabels: z.object({
      authorized: z.string().min(1).max(14),
      unauthorized: z.string().min(1).max(14),
      uncertain: z.string().min(1).max(14),
    }),
  }),
  passiveFiltering: z.object({
    httpql: z.string(),
    onlyInScope: z.boolean(),
    filters: z.array(z.string()),
  }),
  statusDetection: z.object({
    authorizedHttpql: z.string(),
    unauthorizedHttpql: z.string(),
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

const RequestInfoSchema = z.object({
  id: z.string(),
  method: z.string(),
  url: z.url(),
});

const ResponseInfoSchema = z.object({
  id: z.string(),
  code: z.number().int().min(100).max(599),
  length: z.number().int().min(0),
});

export const JobResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("baseline"),
    request: RequestInfoSchema,
    response: ResponseInfoSchema,
  }),
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("mutated"),
    userProfileId: z.string().optional(),
    userProfileName: z.string().optional(),
    request: RequestInfoSchema,
    response: ResponseInfoSchema,
    accessState: AccessStateSchema,
  }),
  z.object({
    kind: z.literal("Ok"),
    type: z.literal("no-auth"),
    request: RequestInfoSchema,
    response: ResponseInfoSchema,
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
