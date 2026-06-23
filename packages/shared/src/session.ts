import { z } from "zod";

export const TokenExtractionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("Header"),
    headerName: z.string().min(1),
    envVar: z.string().min(1),
  }),
  z.object({
    kind: z.literal("JsonBody"),
    jsonPath: z.string().min(1),
    envVar: z.string().min(1),
  }),
  z.object({
    kind: z.literal("Regex"),
    pattern: z.string().min(1),
    envVar: z.string().min(1),
  }),
]);

export type TokenExtraction = z.infer<typeof TokenExtractionSchema>;

export const ReauthRequestSchema = z.object({
  raw: z.string(),
  tls: z.boolean(),
});

export type ReauthRequest = z.infer<typeof ReauthRequestSchema>;

export const SessionManagementSchema = z.object({
  enabled: z.boolean(),
  invalidSessionHttpql: z.string(),
  reauthRequest: ReauthRequestSchema,
  tokenExtractions: z.array(TokenExtractionSchema),
  maxRetries: z.number().int().min(1).max(3).default(1),
});

export type SessionManagement = z.infer<typeof SessionManagementSchema>;
