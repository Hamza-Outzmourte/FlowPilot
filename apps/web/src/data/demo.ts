import type {
  CredentialRecord,
  DashboardStats,
  ExecutionDetail,
  ExecutionSummary,
  KnowledgeCollection,
  KnowledgeDocument,
  NodeRun,
  RetrievalHit,
  StoredWorkflow,
  TemplateRecord,
  UserProfile,
} from "@/types/workflow";
import { createEdge, createFlowNode, DEFAULT_SETTINGS } from "@/lib/workflow-factory";

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

const baseMeta = {
  active: true,
  version: 1,
  tags: [],
  settings: DEFAULT_SETTINGS,
  createdAt: daysAgo(30),
  updatedAt: hoursAgo(2),
};

/* -------------------------------------------------------------------- */
/* Reference workflow (§6.6)                                            */
/* -------------------------------------------------------------------- */

export const REFERENCE_WORKFLOW_ID = "wf_customer_support";

export function createReferenceWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode(
      "flowpilot.telegramTrigger",
      { x: 40, y: 180 },
      {
        id: "n_telegram_trigger",
        label: "Telegram Trigger",
        parameters: { updates: ["message"] },
        status: "idle",
      },
    ),
    createFlowNode(
      "flowpilot.gmailTrigger",
      { x: 40, y: 500 },
      { id: "n_gmail_trigger", label: "Gmail Trigger", parameters: { label: "INBOX" } },
    ),
    createFlowNode(
      "flowpilot.aiAgent",
      { x: 370, y: 180 },
      {
        id: "n_ai_agent",
        label: "AI Agent",
        parameters: {
          systemPrompt:
            "You are FlowPilot's customer support agent. Answer warmly and concisely. Escalate billing issues to email.",
        },
      },
    ),
    createFlowNode(
      "flowpilot.geminiChatModel",
      { x: 388, y: 420 },
      {
        id: "n_gemini",
        label: "Google Gemini Chat Model",
        parameters: { model: "gemini-2.5-flash", temperature: 0.7 },
      },
    ),
    createFlowNode(
      "flowpilot.simpleMemory",
      { x: 453, y: 420 },
      { id: "n_memory", label: "Simple Memory", parameters: { windowSize: 10 } },
    ),
    createFlowNode(
      "flowpilot.if",
      { x: 790, y: 180 },
      {
        id: "n_if",
        label: "If",
        parameters: {
          left: "={{ $json.confidence }}",
          operator: "greater than",
          right: "0.7",
        },
      },
    ),
    createFlowNode(
      "flowpilot.telegramSendMessage",
      { x: 1050, y: 68 },
      {
        id: "n_tg_send",
        label: "Send a text message",
        parameters: {
          chatId: "={{ $('Telegram Trigger').item.json.message.chat.id }}",
          text: "={{ $json.output }}",
        },
      },
    ),
    createFlowNode(
      "flowpilot.gmailReply",
      { x: 1050, y: 300 },
      {
        id: "n_gmail_reply",
        label: "Reply to a message",
        parameters: {
          messageId: "={{ $('Gmail Trigger').item.json.id }}",
          body: "={{ $json.output }}",
        },
      },
    ),
  ];

  const edges = [
    createEdge("n_telegram_trigger", "n_ai_agent", { id: "e_tg_agent" }),
    createEdge("n_ai_agent", "n_if", { id: "e_agent_if" }),
    createEdge("n_if", "n_tg_send", {
      id: "e_if_true",
      sourceHandle: "out-0",
      label: "true",
    }),
    createEdge("n_if", "n_gmail_reply", {
      id: "e_if_false",
      sourceHandle: "out-1",
      label: "false",
    }),
    createEdge("n_gemini", "n_ai_agent", {
      id: "e_model_agent",
      connectionType: "ai_languageModel",
      sourceHandle: "out-0",
      targetHandle: "ai_languageModel",
    }),
    createEdge("n_memory", "n_ai_agent", {
      id: "e_memory_agent",
      connectionType: "ai_memory",
      sourceHandle: "out-0",
      targetHandle: "ai_memory",
    }),
  ];

  return {
    ...baseMeta,
    id: REFERENCE_WORKFLOW_ID,
    name: "Customer support triage",
    description: "Route Telegram questions through an AI agent, escalate to Gmail.",
    active: true,
    version: 7,
    tags: ["Support", "AI", "Telegram"],
    nodes,
    edges,
  };
}

/* -------------------------------------------------------------------- */
/* Other workflows                                                      */
/* -------------------------------------------------------------------- */

function buildDigestWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode("flowpilot.scheduleTrigger", { x: 40, y: 140 }, { id: "d_schedule" }),
    createFlowNode("flowpilot.httpRequest", { x: 260, y: 140 }, { id: "d_http" }),
    createFlowNode("flowpilot.aiAgent", { x: 500, y: 140 }, { id: "d_agent" }),
    createFlowNode("flowpilot.openaiChatModel", { x: 510, y: 370 }, { id: "d_model" }),
    createFlowNode("flowpilot.slackSend", { x: 860, y: 140 }, { id: "d_slack" }),
  ];
  const edges = [
    createEdge("d_schedule", "d_http", { id: "d_e1" }),
    createEdge("d_http", "d_agent", { id: "d_e2" }),
    createEdge("d_model", "d_agent", {
      id: "d_e3",
      connectionType: "ai_languageModel",
      targetHandle: "ai_languageModel",
    }),
    createEdge("d_agent", "d_slack", { id: "d_e4" }),
  ];
  return {
    ...baseMeta,
    id: "wf_daily_digest",
    name: "Daily AI digest",
    description: "Summarize the top AI news every morning and post it to Slack.",
    active: true,
    version: 4,
    tags: ["Marketing", "Schedule"],
    updatedAt: hoursAgo(5),
    nodes,
    edges,
  };
}

function buildInvoiceWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode("flowpilot.gmailTrigger", { x: 40, y: 120 }, { id: "i_trigger" }),
    createFlowNode("flowpilot.documentLoader", { x: 260, y: 300 }, { id: "i_loader" }),
    createFlowNode("flowpilot.aiAgent", { x: 260, y: 120 }, { id: "i_agent" }),
    createFlowNode("flowpilot.geminiChatModel", { x: 270, y: 500 }, { id: "i_model" }),
    createFlowNode("flowpilot.sheetsAppend", { x: 620, y: 120 }, { id: "i_sheets" }),
  ];
  const edges = [
    createEdge("i_trigger", "i_agent", { id: "i_e1" }),
    createEdge("i_model", "i_agent", {
      id: "i_e3",
      connectionType: "ai_languageModel",
      targetHandle: "ai_languageModel",
    }),
    createEdge("i_agent", "i_sheets", { id: "i_e4" }),
  ];
  return {
    ...baseMeta,
    id: "wf_invoice_parser",
    name: "Invoice parser → Sheets",
    description: "Extract invoice totals from Gmail attachments into Google Sheets.",
    active: true,
    version: 12,
    tags: ["Finance", "Gmail"],
    updatedAt: hoursAgo(9),
    nodes,
    edges,
  };
}

function buildRagWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode("flowpilot.chatTrigger", { x: 40, y: 150 }, { id: "r_trigger" }),
    createFlowNode("flowpilot.retrievalQa", { x: 280, y: 150 }, { id: "r_qa" }),
    createFlowNode("flowpilot.openaiChatModel", { x: 250, y: 400 }, { id: "r_model" }),
    createFlowNode("flowpilot.retriever", { x: 420, y: 400 }, { id: "r_retriever" }),
    createFlowNode("flowpilot.respondToChat", { x: 640, y: 150 }, { id: "r_respond" }),
  ];
  const edges = [
    createEdge("r_trigger", "r_qa", { id: "r_e1" }),
    createEdge("r_model", "r_qa", {
      id: "r_e2",
      connectionType: "ai_languageModel",
      targetHandle: "ai_languageModel",
    }),
    createEdge("r_retriever", "r_qa", {
      id: "r_e3",
      connectionType: "ai_retriever",
      targetHandle: "ai_retriever",
    }),
    createEdge("r_qa", "r_respond", { id: "r_e4" }),
  ];
  return {
    ...baseMeta,
    id: "wf_docs_qa",
    name: "Docs Q&A assistant",
    description: "Answer product questions from the knowledge base, with citations.",
    active: false,
    version: 3,
    tags: ["RAG", "Chat"],
    updatedAt: daysAgo(1),
    nodes,
    edges,
  };
}

function buildLeadWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode("flowpilot.webhookTrigger", { x: 40, y: 140 }, { id: "l_trigger" }),
    createFlowNode("flowpilot.httpRequest", { x: 260, y: 140 }, { id: "l_http" }),
    createFlowNode("flowpilot.if", { x: 490, y: 140 }, { id: "l_if" }),
    createFlowNode("flowpilot.notionCreatePage", { x: 720, y: 40 }, { id: "l_notion" }),
    createFlowNode("flowpilot.slackSend", { x: 720, y: 260 }, { id: "l_slack" }),
  ];
  const edges = [
    createEdge("l_trigger", "l_http", { id: "l_e1" }),
    createEdge("l_http", "l_if", { id: "l_e2" }),
    createEdge("l_if", "l_notion", { id: "l_e3", sourceHandle: "out-0", label: "true" }),
    createEdge("l_if", "l_slack", { id: "l_e4", sourceHandle: "out-1", label: "false" }),
  ];
  return {
    ...baseMeta,
    id: "wf_lead_enrichment",
    name: "Lead enrichment",
    description: "Enrich inbound leads, score them and route the good ones to Notion.",
    active: true,
    version: 9,
    tags: ["Sales", "Webhook"],
    updatedAt: daysAgo(2),
    nodes,
    edges,
  };
}

function buildPromptRouterWorkflow(): StoredWorkflow {
  const nodes = [
    createFlowNode(
      "flowpilot.chatTrigger",
      { x: 40, y: 150 },
      {
        id: "p_chat",
        label: "Chat Trigger",
        parameters: { initialMessage: "Hi! Ask me anything and I'll reply on Telegram or Gmail." },
      },
    ),
    createFlowNode(
      "flowpilot.aiAgent",
      { x: 300, y: 150 },
      {
        id: "p_agent",
        label: "AI Agent",
        parameters: {
          systemPrompt:
            "You are FlowPilot's friendly assistant. Answer the user's question naturally and helpfully, as if chatting with a person. Give a complete answer; do not cut it off mid-sentence. Do not mention that you lack personal information.",
        },
      },
    ),
    createFlowNode(
      "flowpilot.geminiChatModel",
      { x: 310, y: 380 },
      { id: "p_model", label: "Google Gemini Chat Model", parameters: { model: "gemini-2.5-flash", temperature: 0.7 } },
    ),
    createFlowNode(
      "flowpilot.simpleMemory",
      { x: 380, y: 380 },
      { id: "p_memory", label: "Simple Memory", parameters: { windowSize: 10 } },
    ),
    createFlowNode(
      "flowpilot.if",
      { x: 620, y: 150 },
      {
        id: "p_if",
        label: "If",
        parameters: {
          left: "={{ $json.channel }}",
          operator: "equals",
          right: "telegram",
        },
      },
    ),
    createFlowNode(
      "flowpilot.telegramSendMessage",
      { x: 880, y: 60 },
      {
        id: "p_telegram",
        label: "Send a text message",
        parameters: {
          chatId: "={{ $('Chat Trigger').item.json.chatId }}",
          text: "={{ $json.output }}",
        },
      },
    ),
    createFlowNode(
      "flowpilot.gmailSend",
      { x: 880, y: 260 },
      {
        id: "p_gmail",
        label: "Send an email",
        parameters: {
          to: "={{ $('Chat Trigger').item.json.email }}",
          subject: "Your FlowPilot answer",
          body: "={{ $json.output }}",
        },
      },
    ),
  ];
  const edges = [
    createEdge("p_chat", "p_agent", { id: "p_e1" }),
    createEdge("p_agent", "p_if", { id: "p_e2" }),
    createEdge("p_if", "p_telegram", { id: "p_e3", sourceHandle: "out-0", label: "telegram" }),
    createEdge("p_if", "p_gmail", { id: "p_e4", sourceHandle: "out-1", label: "gmail" }),
    createEdge("p_model", "p_agent", {
      id: "p_e5",
      connectionType: "ai_languageModel",
      targetHandle: "ai_languageModel",
    }),
    createEdge("p_memory", "p_agent", {
      id: "p_e6",
      connectionType: "ai_memory",
      targetHandle: "ai_memory",
    }),
  ];
  return {
    ...baseMeta,
    id: "wf_prompt_router",
    name: "Prompt router (Telegram / Gmail)",
    description: "User writes a prompt in chat; AI answers and routes the reply to Telegram or Gmail based on the chosen action.",
    active: true,
    version: 3,
    tags: ["AI", "Telegram", "Gmail", "Chat"],
    updatedAt: hoursAgo(1),
    nodes,
    edges,
  };
}

export const DEMO_WORKFLOWS: StoredWorkflow[] = [
  createReferenceWorkflow(),
  buildDigestWorkflow(),
  buildInvoiceWorkflow(),
  buildRagWorkflow(),
  buildLeadWorkflow(),
  buildPromptRouterWorkflow(),
];

export function getDemoWorkflow(id: string): StoredWorkflow | undefined {
  return DEMO_WORKFLOWS.find((workflow) => workflow.id === id);
}

/* -------------------------------------------------------------------- */
/* Executions                                                           */
/* -------------------------------------------------------------------- */

const executionSeed: Array<
  Omit<ExecutionSummary, "id" | "startedAt"> & { minutes: number }
> = [
  {
    workflowId: "wf_customer_support",
    workflowName: "Customer support triage",
    status: "success",
    mode: "trigger",
    trigger: "Telegram",
    triggerIcon: "telegram",
    durationMs: 2410,
    tokens: 1842,
    cost: 0.004,
    nodeRuns: 6,
    minutes: 3,
  },
  {
    workflowId: "wf_daily_digest",
    workflowName: "Daily AI digest",
    status: "success",
    mode: "trigger",
    trigger: "Schedule",
    triggerIcon: "calendar-clock",
    durationMs: 8120,
    tokens: 5210,
    cost: 0.012,
    nodeRuns: 5,
    minutes: 22,
  },
  {
    workflowId: "wf_invoice_parser",
    workflowName: "Invoice parser → Sheets",
    status: "error",
    mode: "trigger",
    trigger: "Gmail",
    triggerIcon: "gmail",
    durationMs: 1204,
    tokens: 640,
    cost: 0.002,
    nodeRuns: 4,
    minutes: 37,
  },
  {
    workflowId: "wf_customer_support",
    workflowName: "Customer support triage",
    status: "success",
    mode: "trigger",
    trigger: "Telegram",
    triggerIcon: "telegram",
    durationMs: 1980,
    tokens: 1320,
    cost: 0.003,
    nodeRuns: 6,
    minutes: 54,
  },
  {
    workflowId: "wf_lead_enrichment",
    workflowName: "Lead enrichment",
    status: "success",
    mode: "trigger",
    trigger: "Webhook",
    triggerIcon: "webhook",
    durationMs: 980,
    tokens: 0,
    cost: 0,
    nodeRuns: 5,
    minutes: 78,
  },
  {
    workflowId: "wf_customer_support",
    workflowName: "Customer support triage",
    status: "success",
    mode: "trigger",
    trigger: "Telegram",
    triggerIcon: "telegram",
    durationMs: 2730,
    tokens: 2104,
    cost: 0.005,
    nodeRuns: 6,
    minutes: 96,
  },
  {
    workflowId: "wf_docs_qa",
    workflowName: "Docs Q&A assistant",
    status: "error",
    mode: "test",
    trigger: "Chat",
    triggerIcon: "message-circle",
    durationMs: 4320,
    tokens: 3120,
    cost: 0.007,
    nodeRuns: 3,
    minutes: 130,
  },
  {
    workflowId: "wf_daily_digest",
    workflowName: "Daily AI digest",
    status: "success",
    mode: "trigger",
    trigger: "Schedule",
    triggerIcon: "calendar-clock",
    durationMs: 7440,
    tokens: 4880,
    cost: 0.011,
    nodeRuns: 5,
    minutes: 160,
  },
  {
    workflowId: "wf_lead_enrichment",
    workflowName: "Lead enrichment",
    status: "success",
    mode: "trigger",
    trigger: "Webhook",
    triggerIcon: "webhook",
    durationMs: 1120,
    tokens: 0,
    cost: 0,
    nodeRuns: 5,
    minutes: 220,
  },
  {
    workflowId: "wf_invoice_parser",
    workflowName: "Invoice parser → Sheets",
    status: "success",
    mode: "trigger",
    trigger: "Gmail",
    triggerIcon: "gmail",
    durationMs: 3320,
    tokens: 1860,
    cost: 0.004,
    nodeRuns: 5,
    minutes: 310,
  },
  {
    workflowId: "wf_customer_support",
    workflowName: "Customer support triage",
    status: "success",
    mode: "trigger",
    trigger: "Telegram",
    triggerIcon: "telegram",
    durationMs: 2180,
    tokens: 1520,
    cost: 0.003,
    nodeRuns: 6,
    minutes: 420,
  },
  {
    workflowId: "wf_docs_qa",
    workflowName: "Docs Q&A assistant",
    status: "success",
    mode: "test",
    trigger: "Chat",
    triggerIcon: "message-circle",
    durationMs: 3980,
    tokens: 2760,
    cost: 0.006,
    nodeRuns: 5,
    minutes: 620,
  },
];

export const DEMO_EXECUTIONS: ExecutionSummary[] = executionSeed.map((execution, index) => ({
  ...execution,
  id: `exec_${String(1024 - index).padStart(4, "0")}`,
  startedAt: minutesAgo(execution.minutes),
}));

export function getExecutionDetail(id: string): ExecutionDetail | undefined {
  const execution = DEMO_EXECUTIONS.find((item) => item.id === id);
  if (!execution) return undefined;
  const workflow = DEMO_WORKFLOWS.find((item) => item.id === execution.workflowId);
  const nodeRuns = (workflow?.nodes ?? [])
    .filter((node) => node.type === "flowpilot")
    .map((node, index): NodeRun => ({
      nodeId: node.id,
      nodeName: node.data.label,
      nodeType: node.data.nodeType,
      status:
        execution.status === "error" && index === 2
          ? ("error" as const)
          : index > 4 && execution.status === "error"
            ? ("skipped" as const)
            : ("success" as const),
      durationMs: 120 + index * 340,
      startedAt: Date.parse(execution.startedAt) + index * 380,
      finishedAt: Date.parse(execution.startedAt) + index * 380 + 120 + index * 340,
      tokens: node.data.group === "ai" ? 420 + index * 100 : 0,
      cost: node.data.group === "ai" ? 0.001 * (index + 1) : 0,
      output:
        node.data.group === "ai"
          ? {
              output:
                "Thanks for reaching out! Your subscription renews on the 1st. I've also looped in billing for the invoice copy.",
              confidence: 0.92,
            }
          : { ok: true },
      error:
        execution.status === "error" && index === 2
          ? "Gmail API returned 429: rate limit exceeded. Retry after 60 seconds."
          : undefined,
    }));
  return { ...execution, nodeRunsDetail: nodeRuns };
}

/* -------------------------------------------------------------------- */
/* Dashboard stats                                                      */
/* -------------------------------------------------------------------- */

export const DEMO_STATS: DashboardStats = {
  totalExecutions: 2481,
  totalExecutionsDelta: 12.4,
  successRate: 96.2,
  successRateDelta: 1.8,
  avgDurationMs: 2840,
  avgDurationDelta: -8.1,
  activeWorkflows: 4,
  activeWorkflowsDelta: 1,
  sparkline: {
    executions: [32, 41, 38, 52, 49, 61, 58, 66, 62, 74, 71, 84],
    success: [94, 95, 93, 96, 95, 97, 96, 97, 96, 98, 97, 96],
    duration: [3.4, 3.1, 3.3, 2.9, 3.0, 2.7, 2.8, 2.6, 2.9, 2.7, 2.8, 2.8],
    workflows: [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4],
  },
  timeline: [
    { label: "Mon", success: 284, error: 9 },
    { label: "Tue", success: 312, error: 14 },
    { label: "Wed", success: 296, error: 7 },
    { label: "Thu", success: 341, error: 18 },
    { label: "Fri", success: 386, error: 11 },
    { label: "Sat", success: 218, error: 5 },
    { label: "Sun", success: 246, error: 8 },
  ],
  aiUsage: [
    { provider: "Google", model: "Gemini 2.5 Flash", tokens: 812_400, cost: 1.62, color: "#4285F4" },
    { provider: "OpenAI", model: "GPT-4.1 mini", tokens: 486_200, cost: 3.4, color: "#10A37F" },
    { provider: "Anthropic", model: "Claude Sonnet 4.5", tokens: 214_800, cost: 2.75, color: "#D97757" },
    { provider: "Ollama", model: "llama3.2 (local)", tokens: 168_900, cost: 0, color: "#8b5cf6" },
  ],
  recentExecutions: DEMO_EXECUTIONS.slice(0, 6),
  topWorkflows: [
    {
      id: "wf_customer_support",
      name: "Customer support triage",
      executions: 1240,
      successRate: 98.1,
      avgDurationMs: 2240,
    },
    {
      id: "wf_daily_digest",
      name: "Daily AI digest",
      executions: 412,
      successRate: 96.8,
      avgDurationMs: 7860,
    },
    {
      id: "wf_invoice_parser",
      name: "Invoice parser → Sheets",
      executions: 386,
      successRate: 91.2,
      avgDurationMs: 2800,
    },
    {
      id: "wf_lead_enrichment",
      name: "Lead enrichment",
      executions: 241,
      successRate: 99.1,
      avgDurationMs: 1020,
    },
  ],
  failingWorkflows: [
    {
      id: "wf_invoice_parser",
      name: "Invoice parser → Sheets",
      failures: 12,
      lastError: "Gmail API rate limit exceeded",
    },
    {
      id: "wf_docs_qa",
      name: "Docs Q&A assistant",
      failures: 5,
      lastError: "Retriever returned no chunks",
    },
  ],
  knowledge: {
    collections: 3,
    documents: 128,
    lastIndexedAt: minutesAgo(18),
    failedIngestions: 1,
  },
};

/* -------------------------------------------------------------------- */
/* Knowledge                                                            */
/* -------------------------------------------------------------------- */

export const DEMO_COLLECTIONS: KnowledgeCollection[] = [
  {
    id: "kc_product_docs",
    name: "Product documentation",
    description: "Help center, API reference and release notes.",
    embeddingModel: "text-embedding-3-small",
    documents: 84,
    chunks: 1240,
    lastIndexedAt: minutesAgo(18),
    status: "ready",
    color: "violet",
  },
  {
    id: "kc_support_macros",
    name: "Support macros",
    description: "Approved replies and escalation playbooks.",
    embeddingModel: "text-embedding-3-small",
    documents: 26,
    chunks: 388,
    lastIndexedAt: hoursAgo(3),
    status: "ready",
    color: "cyan",
  },
  {
    id: "kc_finance",
    name: "Finance policies",
    description: "Invoices, procurement rules and vendor contracts.",
    embeddingModel: "text-embedding-3-large",
    documents: 18,
    chunks: 512,
    lastIndexedAt: hoursAgo(1),
    status: "indexing",
    color: "amber",
  },
];

export const DEMO_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc_1",
    name: "API quickstart.pdf",
    type: "pdf",
    chunks: 42,
    sizeKb: 1840,
    status: "indexed",
    updatedAt: hoursAgo(2),
    source: "Upload",
  },
  {
    id: "doc_2",
    name: "Billing FAQ.md",
    type: "md",
    chunks: 18,
    sizeKb: 64,
    status: "indexed",
    updatedAt: hoursAgo(5),
    source: "Notion sync",
  },
  {
    id: "doc_3",
    name: "Release notes 2026",
    type: "url",
    chunks: 31,
    sizeKb: 0,
    status: "indexed",
    updatedAt: daysAgo(1),
    source: "https://flowpilot.dev/changelog",
  },
  {
    id: "doc_4",
    name: "Integration guide.docx",
    type: "docx",
    chunks: 67,
    sizeKb: 2260,
    status: "processing",
    updatedAt: minutesAgo(6),
    source: "Upload",
  },
  {
    id: "doc_5",
    name: "Support macros.csv",
    type: "csv",
    chunks: 124,
    sizeKb: 320,
    status: "indexed",
    updatedAt: daysAgo(2),
    source: "Upload",
  },
  {
    id: "doc_6",
    name: "Old pricing.txt",
    type: "txt",
    chunks: 0,
    sizeKb: 12,
    status: "failed",
    updatedAt: daysAgo(3),
    source: "Upload",
  },
];

export const DEMO_RETRIEVAL_HITS: RetrievalHit[] = [
  {
    id: "hit_1",
    content:
      "Invoices are generated on the first day of each billing cycle. You can download a PDF copy from Settings → Billing → Invoices.",
    score: 0.91,
    source: "Billing FAQ.md",
  },
  {
    id: "hit_2",
    content:
      "To update your payment method, open Settings → Billing, click “Edit” next to Payment method and save the new card. Changes apply on the next cycle.",
    score: 0.86,
    source: "API quickstart.pdf",
    page: 12,
  },
  {
    id: "hit_3",
    content:
      "Annual plans receive a 20% discount. Refunds are available within 14 days of purchase; contact billing@flowpilot.dev.",
    score: 0.79,
    source: "Release notes 2026",
  },
  {
    id: "hit_4",
    content:
      "Enterprise invoices support purchase orders. Add the PO number in the billing portal before the 25th of the month.",
    score: 0.72,
    source: "Support macros.csv",
  },
];

/* -------------------------------------------------------------------- */
/* Credentials & templates                                              */
/* -------------------------------------------------------------------- */

export const DEMO_CREDENTIALS: CredentialRecord[] = [
  {
    id: "cred_tg",
    name: "FlowPilot Support Bot",
    type: "Telegram API",
    icon: "telegram",
    createdAt: daysAgo(42),
    updatedAt: daysAgo(8),
    lastUsedAt: minutesAgo(3),
    workspace: "Personal",
  },
  {
    id: "cred_gmail",
    name: "Support inbox",
    type: "Gmail OAuth2",
    icon: "gmail",
    createdAt: daysAgo(38),
    updatedAt: daysAgo(12),
    lastUsedAt: minutesAgo(37),
    workspace: "Personal",
  },
  {
    id: "cred_gemini",
    name: "Google AI Studio",
    type: "Google Gemini API",
    icon: "gemini",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
    lastUsedAt: minutesAgo(3),
    workspace: "Personal",
  },
  {
    id: "cred_openai",
    name: "OpenAI production",
    type: "OpenAI API",
    icon: "openai",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
    lastUsedAt: hoursAgo(2),
    workspace: "Personal",
  },
  {
    id: "cred_pg",
    name: "Analytics Postgres",
    type: "Postgres",
    icon: "postgres",
    createdAt: daysAgo(21),
    updatedAt: daysAgo(1),
    lastUsedAt: hoursAgo(4),
    workspace: "Personal",
  },
];

export const DEMO_TEMPLATES: TemplateRecord[] = [
  {
    id: "tpl_support",
    name: "Customer support triage",
    description:
      "Telegram messages are classified by an AI agent and routed to Telegram or Gmail.",
    category: "Support",
    nodes: 8,
    author: "FlowPilot",
    featured: true,
    icon: "telegram",
    gradient: "from-violet-500/30 to-cyan-400/20",
    workflowId: REFERENCE_WORKFLOW_ID,
  },
  {
    id: "tpl_digest",
    name: "Daily AI digest",
    description: "Summarize the latest AI news and deliver a crisp digest to Slack.",
    category: "Marketing",
    nodes: 5,
    author: "FlowPilot",
    featured: true,
    icon: "slack",
    gradient: "from-fuchsia-500/30 to-orange-400/20",
    workflowId: "wf_daily_digest",
  },
  {
    id: "tpl_invoice",
    name: "Invoice parser",
    description: "Extract totals and vendors from Gmail invoices into Google Sheets.",
    category: "Finance",
    nodes: 5,
    author: "FlowPilot",
    icon: "sheets",
    gradient: "from-emerald-500/30 to-lime-400/20",
    workflowId: "wf_invoice_parser",
  },
  {
    id: "tpl_rag",
    name: "Docs Q&A (RAG)",
    description: "Answer questions from your knowledge base with citations.",
    category: "AI",
    nodes: 5,
    author: "FlowPilot",
    featured: true,
    icon: "database",
    gradient: "from-cyan-500/30 to-blue-500/20",
    workflowId: "wf_docs_qa",
  },
  {
    id: "tpl_lead",
    name: "Lead enrichment",
    description: "Enrich inbound leads with HTTP data and route them to Notion.",
    category: "Sales",
    nodes: 5,
    author: "FlowPilot",
    icon: "webhook",
    gradient: "from-amber-500/30 to-rose-400/20",
    workflowId: "wf_lead_enrichment",
  },
  {
    id: "tpl_content",
    name: "Content repurposer",
    description: "Turn a long article into LinkedIn posts, tweets and a newsletter.",
    category: "Marketing",
    nodes: 6,
    author: "FlowPilot",
    icon: "sparkles",
    gradient: "from-purple-500/30 to-pink-400/20",
    workflowId: "wf_daily_digest",
  },
];

export const DEMO_USER: UserProfile = {
  id: "usr_demo",
  name: "Saka Boy",
  email: "saka@flowpilot.dev",
  initials: "SB",
  workspace: "Personal",
  plan: "Pro",
};

export const DEMO_PROVIDER_USAGE = [
  { name: "Gemini 2.5 Flash", tokens: 812_400, cost: 1.62, color: "#4285F4" },
  { name: "GPT-4.1 mini", tokens: 486_200, cost: 3.4, color: "#10A37F" },
  { name: "Claude Sonnet 4.5", tokens: 214_800, cost: 2.75, color: "#D97757" },
  { name: "llama3.2 (local)", tokens: 168_900, cost: 0, color: "#8b5cf6" },
];
