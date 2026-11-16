import type {
  NodeDefinition,
  NodeGroup,
  ParameterSpec,
  PortSpec,
} from "@/types/workflow";

const mainIn: PortSpec[] = [{ type: "main" }];
const mainOut: PortSpec[] = [{ type: "main" }];

function str(
  name: string,
  displayName: string,
  value: string,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return { name, displayName, type: "string", default: value, ...extra };
}

function num(
  name: string,
  displayName: string,
  value: number,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return { name, displayName, type: "number", default: value, ...extra };
}

function bool(
  name: string,
  displayName: string,
  value: boolean,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return { name, displayName, type: "boolean", default: value, ...extra };
}

function options(
  name: string,
  displayName: string,
  values: Array<string | [string, string]>,
  value: string,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return {
    name,
    displayName,
    type: "options",
    default: value,
    options: values.map((v) =>
      Array.isArray(v) ? { label: v[0], value: v[1] } : { label: v, value: v },
    ),
    ...extra,
  };
}

function json(
  name: string,
  displayName: string,
  value: string,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return {
    name,
    displayName,
    type: "json",
    default: value,
    rows: 6,
    language: "json",
    ...extra,
  };
}

function text(
  name: string,
  displayName: string,
  value: string,
  extra: Partial<ParameterSpec> = {},
): ParameterSpec {
  return { name, displayName, type: "string", default: value, rows: 4, ...extra };
}

function trigger(
  type: string,
  displayName: string,
  description: string,
  icon: string,
  subtitle: string,
  properties: ParameterSpec[] = [],
  credentials?: NodeDefinition["credentials"],
): NodeDefinition {
  return {
    type,
    version: 1,
    displayName,
    subtitle,
    description,
    group: "trigger",
    shape: "square",
    icon,
    categories: ["trigger"],
    inputs: [],
    outputs: mainOut,
    credentials,
    properties,
  };
}

function action(
  type: string,
  displayName: string,
  description: string,
  icon: string,
  subtitle: string,
  properties: ParameterSpec[] = [],
  options?: {
    group?: NodeGroup;
    shape?: NodeDefinition["shape"];
    credentials?: NodeDefinition["credentials"];
    subcategory?: string;
    outputs?: PortSpec[];
  },
): NodeDefinition {
  return {
    type,
    version: 1,
    displayName,
    subtitle,
    description,
    group: options?.group ?? "action",
    shape: options?.shape ?? "square",
    icon,
    categories: [options?.group ?? "action"],
    inputs: mainIn,
    outputs: options?.outputs ?? mainOut,
    credentials: options?.credentials,
    properties,
    subcategory: options?.subcategory,
  };
}

function aiNode(
  type: string,
  displayName: string,
  description: string,
  icon: string,
  subtitle: string,
  outputType: "ai_languageModel" | "ai_memory" | "ai_tool" | "ai_embedding" | "ai_vectorStore" | "ai_retriever" | "ai_document" | "ai_textSplitter" | "ai_outputParser",
  properties: ParameterSpec[] = [],
  options?: {
    shape?: NodeDefinition["shape"];
    credentials?: NodeDefinition["credentials"];
    subcategory?: string;
  },
): NodeDefinition {
  const isWide = options?.shape === "wide";
  return {
    type,
    version: 1,
    displayName,
    subtitle,
    description,
    group: "ai",
    shape: options?.shape ?? "circle",
    icon,
    categories: ["ai"],
    inputs: isWide ? mainIn : [],
    outputs: [{ type: outputType }],
    credentials: options?.credentials,
    properties,
    subcategory: options?.subcategory,
  };
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  /* ------------------------------------------------------------------ */
  /* Triggers                                                            */
  /* ------------------------------------------------------------------ */
  trigger(
    "flowpilot.manualTrigger",
    "Manual Trigger",
    "Run the workflow manually from the canvas.",
    "mouse-pointer-click",
    "When clicking 'Execute'",
    [],
  ),
  trigger(
    "flowpilot.webhookTrigger",
    "Webhook",
    "Start the workflow when a webhook is called.",
    "webhook",
    "On webhook call",
    [
      str("path", "Path", "my-webhook", { required: true, placeholder: "my-webhook" }),
      options("method", "HTTP Method", ["GET", "POST", "PUT", "DELETE"], "POST"),
      options("authentication", "Authentication", ["None", "Header Auth", "Basic Auth"], "None"),
    ],
    [{ name: "headerAuth", displayName: "Header Auth", required: false }],
  ),
  trigger(
    "flowpilot.scheduleTrigger",
    "Schedule Trigger",
    "Start the workflow on a recurring schedule.",
    "calendar-clock",
    "On a schedule",
    [
      options(
        "interval",
        "Trigger Interval",
        [
          ["Every 5 minutes", "minutes"],
          ["Every hour", "hours"],
          ["Every day", "days"],
          ["Custom (cron)", "cron"],
        ],
        "hours",
      ),
      str("cron", "Cron Expression", "0 9 * * 1-5", {
        placeholder: "0 9 * * 1-5",
        displayOptions: { show: { interval: ["cron"] } },
      }),
      str("timezone", "Timezone", "Africa/Casablanca"),
    ],
  ),
  trigger(
    "flowpilot.telegramTrigger",
    "Telegram Trigger",
    "Starts the workflow when a Telegram bot receives an update.",
    "telegram",
    "Updates: message",
    [
      {
        name: "updates",
        displayName: "Trigger On",
        type: "multiOptions",
        default: ["message"],
        options: [
          { label: "Message", value: "message" },
          { label: "Edited Message", value: "edited_message" },
          { label: "Callback Query", value: "callback_query" },
          { label: "Channel Post", value: "channel_post" },
        ],
      },
      str("secretToken", "Secret Token", "", {
        description: "Verified on every inbound webhook call.",
      }),
    ],
    [{ name: "telegramApi", displayName: "Telegram API", required: true }],
  ),
  trigger(
    "flowpilot.gmailTrigger",
    "Gmail Trigger",
    "Starts the workflow when a new Gmail message arrives.",
    "gmail",
    "Gmail Trigger",
    [
      options("event", "Event", ["Message Received", "Label Added"], "Message Received"),
      str("label", "Label", "INBOX"),
      options("pollTimes", "Poll Times", ["Every Minute", "Every 5 Minutes", "Every 15 Minutes"], "Every Minute"),
    ],
    [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
  ),
  trigger(
    "flowpilot.chatTrigger",
    "Chat Trigger",
    "Starts an interactive chat session with the workflow.",
    "message-circle",
    "On chat message",
    [str("initialMessage", "Initial Message", "Hi! How can I help you today?")],
  ),
  trigger(
    "flowpilot.formTrigger",
    "Form Trigger",
    "Starts the workflow when a form is submitted.",
    "text-cursor",
    "On form submission",
    [
      str("formTitle", "Form Title", "Contact us", { required: true }),
      json(
        "fields",
        "Form Fields",
        '[\n  { "label": "Name", "type": "text" },\n  { "label": "Email", "type": "email" }\n]',
      ),
    ],
  ),
  trigger(
    "flowpilot.errorTrigger",
    "Error Trigger",
    "Runs when another workflow fails.",
    "bell",
    "On workflow error",
    [],
  ),

  /* ------------------------------------------------------------------ */
  /* AI                                                                  */
  /* ------------------------------------------------------------------ */
  {
    type: "flowpilot.aiAgent",
    version: 1,
    displayName: "AI Agent",
    subtitle: "Agent",
    description:
      "An autonomous agent that reasons, calls tools and answers using a chat model.",
    group: "ai",
    shape: "wide",
    icon: "bot",
    categories: ["ai"],
    inputs: [
      { type: "main" },
      { type: "ai_languageModel", label: "Chat Model", required: true },
      { type: "ai_memory", label: "Memory" },
      { type: "ai_tool", label: "Tool" },
    ],
    outputs: mainOut,
    properties: [
      text(
        "systemPrompt",
        "System Prompt",
        "You are a helpful assistant. Be concise and use the available tools when needed.",
        { rows: 6 },
      ),
      num("maxIterations", "Max Iterations", 10, { description: "Hard cap on agent reasoning loops." }),
      bool("returnIntermediateSteps", "Return Intermediate Steps", true),
      bool("streaming", "Stream Responses", true),
      bool("requireApproval", "Require Approval for Tools", false),
      text("outputSchema", "Output Schema", "", {
        type: "json",
        rows: 4,
        placeholder: "{\n  \"type\": \"object\"\n}",
        description: "Optional structured output schema.",
      }),
    ],
    subcategory: "Agents",
  },
  {
    type: "flowpilot.basicLlmChain",
    version: 1,
    displayName: "Basic LLM Chain",
    description: "Send a prompt to a chat model and use the response.",
    group: "ai",
    shape: "square",
    icon: "sparkles",
    categories: ["ai"],
    inputs: [
      { type: "main" },
      { type: "ai_languageModel", label: "Chat Model", required: true },
    ],
    outputs: mainOut,
    properties: [
      text("prompt", "Prompt", "Summarize the following text:\n\n{{ $json.text }}", { rows: 6 }),
    ],
    subcategory: "Chains",
  },
  {
    type: "flowpilot.retrievalQa",
    version: 1,
    displayName: "Retrieval QA Chain",
    description: "Answer questions using a retriever and cite the source chunks.",
    group: "ai",
    shape: "square",
    icon: "search",
    categories: ["ai"],
    inputs: [
      { type: "main" },
      { type: "ai_languageModel", label: "Chat Model", required: true },
      { type: "ai_retriever", label: "Retriever", required: true },
    ],
    outputs: mainOut,
    properties: [text("question", "Question", "{{ $json.message.text }}", { rows: 3 }), bool("citeSources", "Cite Sources", true)],
    subcategory: "Chains",
  },
  aiNode(
    "flowpilot.geminiChatModel",
    "Google Gemini Chat Model",
    "Google's Gemini family of multimodal models.",
    "gemini",
    "Chat Model",
    "ai_languageModel",
    [
      options(
        "model",
        "Model",
        [
          ["Gemini 2.5 Pro", "gemini-2.5-pro"],
          ["Gemini 2.5 Flash", "gemini-2.5-flash"],
          ["Gemini 2.0 Flash", "gemini-2.0-flash"],
        ],
        "gemini-2.5-flash",
      ),
      num("temperature", "Temperature", 0.7, { description: "0 is deterministic, 1 is creative." }),
      num("maxTokens", "Max Tokens", 2048),
    ],
    {
      credentials: [{ name: "googlePalmApi", displayName: "Google Gemini API", required: true }],
      subcategory: "Chat Models",
    },
  ),
  aiNode(
    "flowpilot.openaiChatModel",
    "OpenAI Chat Model",
    "GPT models from OpenAI.",
    "openai",
    "Chat Model",
    "ai_languageModel",
    [
      options("model", "Model", ["gpt-4.1", "gpt-4.1-mini", "o4-mini"], "gpt-4.1-mini"),
      num("temperature", "Temperature", 0.7),
      num("maxTokens", "Max Tokens", 2048),
    ],
    {
      credentials: [{ name: "openAiApi", displayName: "OpenAI API", required: true }],
      subcategory: "Chat Models",
    },
  ),
  aiNode(
    "flowpilot.anthropicChatModel",
    "Anthropic Chat Model",
    "Claude models from Anthropic.",
    "anthropic",
    "Chat Model",
    "ai_languageModel",
    [
      options("model", "Model", ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"], "claude-sonnet-4-5"),
      num("temperature", "Temperature", 0.7),
      num("maxTokens", "Max Tokens", 4096),
    ],
    {
      credentials: [{ name: "anthropicApi", displayName: "Anthropic API", required: true }],
      subcategory: "Chat Models",
    },
  ),
  aiNode(
    "flowpilot.ollamaChatModel",
    "Ollama Chat Model",
    "Run open models locally through Ollama.",
    "ollama",
    "Chat Model",
    "ai_languageModel",
    [
      str("model", "Model", "llama3.2"),
      str("baseUrl", "Base URL", "http://localhost:11434"),
      num("temperature", "Temperature", 0.7),
    ],
    { subcategory: "Chat Models" },
  ),
  aiNode(
    "flowpilot.simpleMemory",
    "Simple Memory",
    "Keep a windowed conversation buffer in memory.",
    "brain",
    "Memory",
    "ai_memory",
    [
      num("windowSize", "Context Window Length", 10),
      str("sessionKey", "Session Key", "={{ $json.sessionId }}"),
    ],
    { subcategory: "Memory" },
  ),
  aiNode(
    "flowpilot.postgresMemory",
    "Postgres Chat Memory",
    "Persist conversation history in PostgreSQL.",
    "database",
    "Memory",
    "ai_memory",
    [num("windowSize", "Context Window Length", 20), str("tableName", "Table Name", "chat_history")],
    {
      credentials: [{ name: "postgresDb", displayName: "Postgres", required: true }],
      subcategory: "Memory",
    },
  ),
  aiNode(
    "flowpilot.redisMemory",
    "Redis Chat Memory",
    "Persist conversation history in Redis.",
    "hard-drive",
    "Memory",
    "ai_memory",
    [num("windowSize", "Context Window Length", 20), num("ttl", "TTL (seconds)", 3600)],
    { subcategory: "Memory" },
  ),
  aiNode(
    "flowpilot.httpTool",
    "HTTP Request Tool",
    "Let the agent call an HTTP endpoint.",
    "http",
    "Tool",
    "ai_tool",
    [
      str("description", "Description", "Call an external API and return JSON.", { rows: 3 }),
      options("method", "Method", ["GET", "POST", "PUT", "DELETE"], "GET"),
      str("url", "URL", "https://api.example.com/search?q={{ $query }}"),
    ],
    { credentials: [{ name: "httpHeaderAuth", displayName: "Header Auth", required: false }], subcategory: "Tools" },
  ),
  aiNode(
    "flowpilot.calculatorTool",
    "Calculator Tool",
    "Evaluate arithmetic expressions for the agent.",
    "calculator",
    "Tool",
    "ai_tool",
    [str("description", "Description", "Evaluate a math expression.")],
    { subcategory: "Tools" },
  ),
  aiNode(
    "flowpilot.codeTool",
    "Code Tool",
    "Run a sandboxed script as an agent tool.",
    "code",
    "Tool",
    "ai_tool",
    [
      str("description", "Description", "Transform data with JavaScript."),
      { name: "code", displayName: "Code", type: "code", default: "return items;", language: "javascript", rows: 8 },
    ],
    { subcategory: "Tools" },
  ),
  aiNode(
    "flowpilot.vectorStoreTool",
    "Vector Store Tool",
    "Give the agent semantic search over a knowledge collection.",
    "database",
    "Tool",
    "ai_tool",
    [
      str("description", "Description", "Search the knowledge base and return relevant passages."),
      str("collection", "Collection", "", { type: "resourceLocator", placeholder: "Select collection" }),
      num("topK", "Top K", 4),
    ],
    { subcategory: "Tools" },
  ),
  aiNode(
    "flowpilot.embeddingsOpenai",
    "OpenAI Embeddings",
    "Embed documents and queries with OpenAI.",
    "openai",
    "Embeddings",
    "ai_embedding",
    [options("model", "Model", ["text-embedding-3-small", "text-embedding-3-large"], "text-embedding-3-small")],
    {
      credentials: [{ name: "openAiApi", displayName: "OpenAI API", required: true }],
      subcategory: "RAG",
    },
  ),
  aiNode(
    "flowpilot.vectorStorePgvector",
    "Postgres Vector Store",
    "Store and query embeddings in PostgreSQL with pgvector.",
    "postgres",
    "Vector Store",
    "ai_vectorStore",
    [
      str("tableName", "Table Name", "knowledge_chunks"),
      options("mode", "Mode", ["Insert", "Retrieve", "Update"], "Retrieve"),
      num("topK", "Top K", 4),
    ],
    {
      credentials: [{ name: "postgresDb", displayName: "Postgres", required: true }],
      subcategory: "RAG",
    },
  ),
  aiNode(
    "flowpilot.retriever",
    "Vector Store Retriever",
    "Retrieve the most relevant chunks from a vector store.",
    "search",
    "Retriever",
    "ai_retriever",
    [str("collection", "Collection", "", { type: "resourceLocator" }), num("topK", "Top K", 4), bool("mmr", "MMR Diversity", true)],
    { subcategory: "RAG" },
  ),
  aiNode(
    "flowpilot.documentLoader",
    "Document Loader",
    "Load PDFs, docs, markdown or web pages.",
    "file-text",
    "Document Loader",
    "ai_document",
    [
      options("source", "Source", ["Upload", "URL", "Google Drive", "Notion"], "Upload"),
      str("url", "URL", "https://", { displayOptions: { show: { source: ["URL"] } } }),
    ],
    { subcategory: "RAG" },
  ),
  aiNode(
    "flowpilot.textSplitter",
    "Recursive Text Splitter",
    "Split long documents into overlapping chunks.",
    "align-left",
    "Text Splitter",
    "ai_textSplitter",
    [num("chunkSize", "Chunk Size", 900), num("overlap", "Overlap", 120)],
    { subcategory: "RAG" },
  ),
  aiNode(
    "flowpilot.outputParser",
    "Structured Output Parser",
    "Force the model to answer with a JSON schema.",
    "braces",
    "Output Parser",
    "ai_outputParser",
    [json("schema", "Schema", '{\n  "type": "object",\n  "properties": {}\n}')],
    { subcategory: "Parsers" },
  ),
  {
    type: "flowpilot.guardrails",
    version: 1,
    displayName: "Guardrails",
    description: "Screen input and output for prompt injection, PII and unsafe content.",
    group: "ai",
    shape: "square",
    icon: "shield-check",
    categories: ["ai"],
    inputs: mainIn,
    outputs: mainOut,
    properties: [
      bool("redactPii", "Redact PII", true),
      bool("blockInjection", "Block Prompt Injection", true),
      options("onViolation", "On Violation", ["Stop", "Flag and continue"], "Stop"),
    ],
    subcategory: "Safety",
  },

  /* ------------------------------------------------------------------ */
  /* Actions                                                             */
  /* ------------------------------------------------------------------ */
  action(
    "flowpilot.telegramSendMessage",
    "Send a text message",
    "Send a message to a Telegram chat.",
    "telegram",
    "sendMessage: message",
    [
      str("chatId", "Chat ID", "={{ $json.message.chat.id }}", { required: true }),
      text("text", "Text", "={{ $json.output }}", { rows: 4 }),
      bool("replyToMessage", "Reply to Message", false),
    ],
    {
      credentials: [{ name: "telegramApi", displayName: "Telegram API", required: true }],
      subcategory: "Telegram",
    },
  ),
  action(
    "flowpilot.telegramSendPhoto",
    "Send a photo",
    "Send an image to a Telegram chat.",
    "telegram",
    "sendPhoto: photo",
    [str("chatId", "Chat ID", "={{ $json.message.chat.id }}"), str("photoUrl", "Photo URL", ""), str("caption", "Caption", "")],
    {
      credentials: [{ name: "telegramApi", displayName: "Telegram API", required: true }],
      subcategory: "Telegram",
    },
  ),
  action(
    "flowpilot.telegramEditMessage",
    "Edit a message",
    "Edit a previously sent Telegram message.",
    "telegram",
    "editMessageText: text",
    [str("chatId", "Chat ID", ""), str("messageId", "Message ID", ""), text("text", "Text", "")],
    {
      credentials: [{ name: "telegramApi", displayName: "Telegram API", required: true }],
      subcategory: "Telegram",
    },
  ),
  action(
    "flowpilot.gmailReply",
    "Reply to a message",
    "Reply to a Gmail thread.",
    "gmail",
    "reply: message",
    [
      str("messageId", "Message ID", "={{ $json.id }}", { required: true }),
      text("body", "Message", "={{ $json.output }}", { rows: 5 }),
      bool("replyAll", "Reply All", false),
    ],
    {
      credentials: [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
      subcategory: "Gmail",
    },
  ),
  action(
    "flowpilot.gmailSend",
    "Send an email",
    "Send a new Gmail message.",
    "gmail",
    "send: message",
    [
      str("to", "To", "", { required: true }),
      str("subject", "Subject", ""),
      text("body", "Message", "", { rows: 5 }),
    ],
    {
      credentials: [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
      subcategory: "Gmail",
    },
  ),
  action(
    "flowpilot.gmailAddLabel",
    "Add a label",
    "Apply a label to a Gmail message.",
    "gmail",
    "addLabel: label",
    [str("messageId", "Message ID", ""), str("label", "Label", "")],
    {
      credentials: [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
      subcategory: "Gmail",
    },
  ),
  action(
    "flowpilot.gmailGet",
    "Get a message",
    "Fetch a Gmail message by ID.",
    "gmail",
    "get: message",
    [str("messageId", "Message ID", "")],
    {
      credentials: [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
      subcategory: "Gmail",
    },
  ),
  action(
    "flowpilot.sheetsAppend",
    "Append a row",
    "Append a row to a Google Sheet.",
    "sheets",
    "append: sheet",
    [
      str("spreadsheetId", "Spreadsheet", "", { type: "resourceLocator" }),
      str("sheetName", "Sheet Name", "Sheet1"),
      json("values", "Values", '["{{ $json.name }}", "{{ $json.email }}"]'),
    ],
    {
      credentials: [{ name: "googleSheetsOAuth2", displayName: "Google Sheets OAuth2", required: true }],
      subcategory: "Google Sheets",
    },
  ),
  action(
    "flowpilot.sheetsRead",
    "Read rows",
    "Read rows from a Google Sheet.",
    "sheets",
    "read: sheet",
    [str("spreadsheetId", "Spreadsheet", ""), str("range", "Range", "A1:Z100")],
    {
      credentials: [{ name: "googleSheetsOAuth2", displayName: "Google Sheets OAuth2", required: true }],
      subcategory: "Google Sheets",
    },
  ),
  action(
    "flowpilot.notionCreatePage",
    "Create a page",
    "Create a Notion page in a database.",
    "notion",
    "createPage: page",
    [str("databaseId", "Database", ""), str("title", "Title", "={{ $json.title }}"), json("properties", "Properties", "{}")],
    {
      credentials: [{ name: "notionApi", displayName: "Notion API", required: true }],
      subcategory: "Notion",
    },
  ),
  action(
    "flowpilot.notionQuery",
    "Query a database",
    "Query a Notion database.",
    "notion",
    "query: database",
    [str("databaseId", "Database", ""), json("filter", "Filter", "{}")],
    {
      credentials: [{ name: "notionApi", displayName: "Notion API", required: true }],
      subcategory: "Notion",
    },
  ),
  action(
    "flowpilot.slackSend",
    "Send a message",
    "Send a message to a Slack channel.",
    "slack",
    "chat.postMessage: message",
    [str("channel", "Channel", "#general"), text("text", "Message", "{{ $json.output }}")],
    {
      credentials: [{ name: "slackApi", displayName: "Slack API", required: true }],
      subcategory: "Slack",
    },
  ),
  action(
    "flowpilot.slackUpdate",
    "Update a message",
    "Update an existing Slack message.",
    "slack",
    "chat.update: message",
    [str("channel", "Channel", ""), str("timestamp", "Timestamp", ""), text("text", "Message", "")],
    {
      credentials: [{ name: "slackApi", displayName: "Slack API", required: true }],
      subcategory: "Slack",
    },
  ),
  action(
    "flowpilot.discordSend",
    "Send a message",
    "Send a message to a Discord channel.",
    "discord",
    "sendMessage: message",
    [str("channelId", "Channel ID", ""), text("content", "Message", "")],
    {
      credentials: [{ name: "discordApi", displayName: "Discord API", required: true }],
      subcategory: "Discord",
    },
  ),
  action(
    "flowpilot.githubCreateIssue",
    "Create an issue",
    "Open a GitHub issue.",
    "github",
    "createIssue: issue",
    [str("repository", "Repository", "owner/repo"), str("title", "Title", ""), text("body", "Body", "")],
    {
      credentials: [{ name: "githubApi", displayName: "GitHub API", required: true }],
      subcategory: "GitHub",
    },
  ),
  action(
    "flowpilot.airtableCreate",
    "Create a record",
    "Create a record in an Airtable base.",
    "airtable",
    "create: record",
    [str("baseId", "Base", ""), str("table", "Table", ""), json("fields", "Fields", "{}")],
    {
      credentials: [{ name: "airtableApi", displayName: "Airtable API", required: true }],
      subcategory: "Airtable",
    },
  ),
  action(
    "flowpilot.postgresQuery",
    "Execute a query",
    "Run SQL against PostgreSQL.",
    "postgres",
    "executeQuery: query",
    [text("query", "Query", "SELECT * FROM users LIMIT 10;", { type: "code", language: "text", rows: 5 })],
    {
      credentials: [{ name: "postgresDb", displayName: "Postgres", required: true }],
      subcategory: "Postgres",
    },
  ),
  action(
    "flowpilot.s3Upload",
    "Upload a file",
    "Upload an object to an S3 bucket.",
    "s3",
    "putObject: file",
    [str("bucket", "Bucket", ""), str("key", "Key", "={{ $json.filename }}")],
    {
      credentials: [{ name: "s3Api", displayName: "AWS S3", required: true }],
      subcategory: "AWS S3",
    },
  ),

  /* ------------------------------------------------------------------ */
  /* Data transformation                                                 */
  /* ------------------------------------------------------------------ */
  action(
    "flowpilot.set",
    "Edit Fields",
    "Set, rename or remove fields on every item.",
    "square-pen",
    "set: fields",
    [
      options("mode", "Mode", ["Manual Mapping", "JSON"], "Manual Mapping"),
      json("fields", "Fields", '{\n  "name": "{{ $json.name }}",\n  "email": "{{ $json.email }}"\n}', {
        rows: 7,
        displayOptions: { show: { mode: ["JSON"] } },
      }),
      bool("keepOnlySet", "Keep Only Set Fields", false),
    ],
    { group: "data", subcategory: "Transform" },
  ),
  action(
    "flowpilot.filter",
    "Filter",
    "Keep items that match a condition.",
    "filter",
    "filter: items",
    [
      str("left", "Value 1", "={{ $json.status }}"),
      options("operator", "Operator", ["equals", "not equals", "contains", "greater than", "less than", "exists"], "equals"),
      str("right", "Value 2", "active"),
    ],
    { group: "data", subcategory: "Filter" },
  ),
  action(
    "flowpilot.sort",
    "Sort",
    "Sort items by one or more fields.",
    "arrow-up-down",
    "sort: items",
    [str("field", "Field", "createdAt"), options("direction", "Direction", ["Ascending", "Descending"], "Descending")],
    { group: "data", subcategory: "Transform" },
  ),
  action(
    "flowpilot.aggregate",
    "Aggregate",
    "Group items and compute aggregates.",
    "sigma",
    "aggregate: items",
    [str("groupBy", "Group By", ""), options("operation", "Operation", ["Count", "Sum", "Average", "Min", "Max"], "Count")],
    { group: "data", subcategory: "Transform" },
  ),
  action(
    "flowpilot.splitOut",
    "Split Out",
    "Turn an array field into multiple items.",
    "layers",
    "splitOut: items",
    [str("field", "Field to Split", "items")],
    { group: "data", subcategory: "Transform" },
  ),
  action(
    "flowpilot.summarize",
    "Summarize",
    "Summarize items into a single aggregated item.",
    "align-left",
    "summarize: items",
    [options("operation", "Operation", ["Count", "Sum", "Concatenate"], "Count")],
    { group: "data", subcategory: "Transform" },
  ),
  action(
    "flowpilot.dateTime",
    "Date & Time",
    "Parse, format or add to dates.",
    "calendar-clock",
    "format: date",
    [options("operation", "Operation", ["Format", "Add", "Subtract"], "Format"), str("format", "Format", "yyyy-MM-dd")],
    { group: "data", subcategory: "Convert" },
  ),
  action(
    "flowpilot.crypto",
    "Crypto",
    "Hash, encrypt or sign values.",
    "shield-check",
    "hash: value",
    [options("action", "Action", ["Hash", "HMAC", "Encrypt", "Decrypt"], "Hash"), options("algorithm", "Algorithm", ["SHA256", "SHA512", "MD5"], "SHA256")],
    { group: "data", subcategory: "Convert" },
  ),
  action(
    "flowpilot.json",
    "JSON",
    "Parse or stringify JSON.",
    "file-json",
    "parse: json",
    [options("action", "Action", ["Parse", "Stringify"], "Parse")],
    { group: "data", subcategory: "Convert" },
  ),
  action(
    "flowpilot.xml",
    "XML",
    "Convert between XML and JSON.",
    "file-code",
    "convert: xml",
    [options("action", "Action", ["XML to JSON", "JSON to XML"], "XML to JSON")],
    { group: "data", subcategory: "Convert" },
  ),
  action(
    "flowpilot.csv",
    "CSV",
    "Parse or generate CSV.",
    "file-csv",
    "convert: csv",
    [options("action", "Action", ["Parse", "Generate"], "Parse"), options("delimiter", "Delimiter", [",", ";", "\\t"], ",")],
    { group: "data", subcategory: "Convert" },
  ),
  action(
    "flowpilot.html",
    "HTML",
    "Extract content or generate HTML.",
    "file-text",
    "extract: html",
    [options("operation", "Operation", ["Extract Text", "Extract HTML", "Generate"], "Extract Text")],
    { group: "data", subcategory: "Convert" },
  ),

  /* ------------------------------------------------------------------ */
  /* Flow                                                                */
  /* ------------------------------------------------------------------ */
  action(
    "flowpilot.if",
    "If",
    "Route items down a true or false branch.",
    "if",
    "Condition",
    [
      str("left", "Value 1", "={{ $json.score }}"),
      options("operator", "Operator", ["equals", "not equals", "contains", "greater than", "less than", "exists"], "greater than"),
      str("right", "Value 2", "0.5"),
      options("combinator", "Combine", ["AND", "OR"], "AND"),
    ],
    {
      group: "flow",
      outputs: [
        { type: "main", label: "true" },
        { type: "main", label: "false" },
      ],
      subcategory: "Branch",
    },
  ),
  action(
    "flowpilot.switch",
    "Switch",
    "Route items to one of several outputs by rules.",
    "split",
    "Switch",
    [json("rules", "Routing Rules", '[\n  { "output": "high", "value": "> 0.8" },\n  { "output": "low", "value": "<= 0.8" }\n]')],
    {
      group: "flow",
      outputs: [
        { type: "main", label: "High" },
        { type: "main", label: "Low" },
        { type: "main", label: "Fallback" },
      ],
      subcategory: "Branch",
    },
  ),
  action(
    "flowpilot.merge",
    "Merge",
    "Merge data from multiple branches.",
    "git-merge",
    "Merge",
    [options("mode", "Mode", ["Append", "Combine by key", "Choose branch"], "Append")],
    { group: "flow", subcategory: "Join" },
  ),
  action(
    "flowpilot.loop",
    "Loop Over Items",
    "Run the following nodes once per item in batches.",
    "repeat",
    "loop: items",
    [num("batchSize", "Batch Size", 1)],
    {
      group: "flow",
      outputs: [
        { type: "main", label: "done" },
        { type: "main", label: "loop" },
      ],
      subcategory: "Loop",
    },
  ),
  action(
    "flowpilot.wait",
    "Wait",
    "Pause the workflow for a while or until an event.",
    "clock",
    "wait",
    [options("resume", "Resume", ["After Time Interval", "At Specified Time", "On Webhook Call"], "After Time Interval"), num("amount", "Amount", 1), options("unit", "Unit", ["Seconds", "Minutes", "Hours"], "Seconds")],
    { group: "flow", subcategory: "Utilities" },
  ),
  action(
    "flowpilot.stopAndError",
    "Stop and Error",
    "Stop the workflow and optionally raise an error.",
    "circle-stop",
    "stop",
    [options("action", "Action", ["Stop", "Error"], "Stop"), str("message", "Error Message", "")],
    { group: "flow", subcategory: "Utilities" },
  ),
  action(
    "flowpilot.executeWorkflow",
    "Execute Sub-workflow",
    "Call another workflow and wait for its result.",
    "workflow",
    "executeWorkflow",
    [str("workflowId", "Workflow", "", { type: "resourceLocator" })],
    { group: "flow", subcategory: "Utilities" },
  ),

  /* ------------------------------------------------------------------ */
  /* Core                                                                */
  /* ------------------------------------------------------------------ */
  action(
    "flowpilot.code",
    "Code",
    "Run JavaScript or Python in an isolated sandbox.",
    "code",
    "run: code",
    [
      options("language", "Language", ["JavaScript", "Python"], "JavaScript"),
      {
        name: "code",
        displayName: "Code",
        type: "code",
        language: "javascript",
        rows: 12,
        default:
          "// Each item is available in `items`.\nreturn items.map(item => ({\n  json: { ...item.json, processed: true }\n}));",
      },
    ],
    { group: "core", subcategory: "Code" },
  ),
  action(
    "flowpilot.httpRequest",
    "HTTP Request",
    "Make an HTTP request with SSRF protection.",
    "http",
    "request: GET",
    [
      options("method", "Method", ["GET", "POST", "PUT", "PATCH", "DELETE"], "GET"),
      str("url", "URL", "https://api.example.com", { required: true }),
      json("headers", "Headers", "{}"),
      json("body", "Body", "{}", { displayOptions: { show: { method: ["POST", "PUT", "PATCH"] } } }),
      options("responseFormat", "Response Format", ["Autodetect", "JSON", "Text", "Binary"], "Autodetect"),
      num("timeout", "Timeout (ms)", 30000),
    ],
    {
      group: "core",
      credentials: [{ name: "httpHeaderAuth", displayName: "Header Auth", required: false }],
      subcategory: "Web",
    },
  ),
  action(
    "flowpilot.webhookResponse",
    "Webhook Response",
    "Respond to the caller of a webhook trigger.",
    "webhook",
    "respond: webhook",
    [num("statusCode", "Status Code", 200), json("body", "Response Body", '{"ok": true}')],
    { group: "core", subcategory: "Web" },
  ),
  action(
    "flowpilot.respondToChat",
    "Respond to Chat",
    "Send a message back to the chat interface.",
    "message-square",
    "respond: chat",
    [text("message", "Message", "{{ $json.output }}"), bool("stream", "Stream Response", true)],
    { group: "core", subcategory: "Web" },
  ),
  action(
    "flowpilot.readFiles",
    "Read Files",
    "Read files from the workspace.",
    "folder-open",
    "read: files",
    [str("path", "Path", "/data")],
    { group: "core", subcategory: "Files" },
  ),
  action(
    "flowpilot.writeFiles",
    "Write Files",
    "Write files to the workspace.",
    "hard-drive",
    "write: files",
    [str("path", "Path", "/data/output.json"), str("content", "Content", "")],
    { group: "core", subcategory: "Files" },
  ),

  /* ------------------------------------------------------------------ */
  /* Human review                                                        */
  /* ------------------------------------------------------------------ */
  action(
    "flowpilot.approvalSlack",
    "Request approval in Slack",
    "Pause and ask a human to approve the next action.",
    "slack",
    "approval: Slack",
    [str("channel", "Channel", "#approvals"), text("message", "Message", "Approve this AI action?")],
    {
      group: "human",
      subcategory: "Slack",
      credentials: [{ name: "slackApi", displayName: "Slack API", required: true }],
    },
  ),
  action(
    "flowpilot.approvalTelegram",
    "Request approval in Telegram",
    "Pause and ask a human to approve the next action.",
    "telegram",
    "approval: Telegram",
    [str("chatId", "Chat ID", ""), text("message", "Message", "Approve this AI action?")],
    {
      group: "human",
      subcategory: "Telegram",
      credentials: [{ name: "telegramApi", displayName: "Telegram API", required: true }],
    },
  ),
  action(
    "flowpilot.approvalEmail",
    "Request approval by Email",
    "Pause and ask a human to approve the next action.",
    "mail",
    "approval: Email",
    [str("to", "To", ""), text("message", "Message", "Approve this AI action?")],
    {
      group: "human",
      subcategory: "Email",
      credentials: [{ name: "gmailOAuth2", displayName: "Gmail OAuth2", required: true }],
    },
  ),
];

const definitionMap = new Map(NODE_DEFINITIONS.map((d) => [d.type, d]));

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return definitionMap.get(type);
}

export function requireNodeDefinition(type: string): NodeDefinition {
  const definition = definitionMap.get(type);
  if (!definition) throw new Error(`Unknown node type: ${type}`);
  return definition;
}

export function defaultParameters(definition: NodeDefinition): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const property of definition.properties) {
    if (property.default !== undefined) {
      params[property.name] = Array.isArray(property.default)
        ? [...property.default]
        : property.default;
    } else if (property.type === "boolean") {
      params[property.name] = false;
    } else if (property.type === "number") {
      params[property.name] = 0;
    } else {
      params[property.name] = "";
    }
  }
  return params;
}

export interface CreatorCategory {
  id: NodeGroup;
  title: string;
  description: string;
  icon: string;
  divider?: boolean;
}

export const CREATOR_CATEGORIES: CreatorCategory[] = [
  {
    id: "ai",
    title: "AI",
    description: "Build autonomous agents, summarize or search documents, etc.",
    icon: "sparkles",
  },
  {
    id: "action",
    title: "Action in an app",
    description: "Do something in an app or service like Google Sheets, Telegram or Notion",
    icon: "blocks",
  },
  {
    id: "data",
    title: "Data transformation",
    description: "Manipulate, filter or convert data",
    icon: "table",
  },
  {
    id: "flow",
    title: "Flow",
    description: "Branch, merge or loop the flow, etc.",
    icon: "git-branch",
  },
  {
    id: "core",
    title: "Core",
    description: "Run code, make HTTP requests, set webhooks, etc.",
    icon: "code",
  },
  {
    id: "human",
    title: "Human review",
    description: "Request approval via Slack and Telegram before making tool calls",
    icon: "user-check",
  },
  {
    id: "trigger",
    title: "Add another trigger",
    description: "Triggers start your workflow. Workflows can have multiple triggers.",
    icon: "zap",
    divider: true,
  },
];

export function nodesForGroup(group: NodeGroup): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((d) => d.group === group);
}

export function subcategoriesForGroup(group: NodeGroup): string[] {
  const seen: string[] = [];
  for (const node of nodesForGroup(group)) {
    if (node.subcategory && !seen.includes(node.subcategory)) {
      seen.push(node.subcategory);
    }
  }
  return seen;
}

export function nodesForSubcategory(group: NodeGroup, subcategory: string): NodeDefinition[] {
  return nodesForGroup(group).filter((n) => n.subcategory === subcategory);
}

export const TRIGGER_TYPES = NODE_DEFINITIONS.filter((d) => d.group === "trigger").map(
  (d) => d.type,
);

export const AI_AGENT_TYPE = "flowpilot.aiAgent";

export const AI_SUB_PORT_SPECS = [
  { id: "ai_languageModel", label: "Chat Model", type: "ai_languageModel" as const, required: true },
  { id: "ai_memory", label: "Memory", type: "ai_memory" as const },
  { id: "ai_tool", label: "Tool", type: "ai_tool" as const },
];
