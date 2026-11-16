import { z } from "zod";

export const connectionTypeSchema = z.enum([
  "main",
  "ai_languageModel",
  "ai_memory",
  "ai_tool",
  "ai_embedding",
  "ai_vectorStore",
  "ai_retriever",
  "ai_document",
  "ai_textSplitter",
  "ai_outputParser",
]);

const workflowSettingsSchema = z.object({
  timezone: z.string().min(1),
  timeoutSeconds: z.number().int().positive(),
  saveExecutionData: z.enum(["all", "none", "errors"]),
});

const workflowNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    name: z.string().min(1),
    position: z.tuple([z.number(), z.number()]),
    parameters: z.record(z.string(), z.unknown()).default({}),
    credentials: z.record(z.string(), z.string()).optional(),
    disabled: z.boolean().optional(),
  })
  .strict();

const connectionTargetSchema = z
  .object({
    node: z.string().min(1),
    type: connectionTypeSchema,
    index: z.number().int().nonnegative(),
  })
  .strict();

const connectionValueSchema = z.record(
  connectionTypeSchema,
  z.array(z.array(connectionTargetSchema)),
);

export const workflowJsonSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    active: z.boolean(),
    version: z.number().int().nonnegative(),
    nodes: z.array(workflowNodeSchema),
    connections: z.record(z.string(), connectionValueSchema).default({}),
    settings: workflowSettingsSchema.default({
      timezone: "Africa/Casablanca",
      timeoutSeconds: 3600,
      saveExecutionData: "all",
    }),
    pinData: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();

export type WorkflowJsonInput = z.infer<typeof workflowJsonSchema>;
