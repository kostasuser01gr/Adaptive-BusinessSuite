/**
 * Model gateway — provider-agnostic AI layer.
 */

import { getWorkspaceContext } from "./rag";

export interface AssistantContext {
  userId: string;
  mode: string;
  moduleTypes: string[];
}

export interface ProposedAction {
  type: string;
  payload: any;
  id?: string;
  label: string;
}

export interface AssistantResult {
  response: string;
  moduleToAdd: {
    type: string;
    title: string;
    w: string;
    h: string;
    data?: any;
  } | null;
  proposedAction: ProposedAction | null;
  workflow: ProposedAction[] | null;
  generativeUI: { type: string; props: any } | null;
  clearDashboard: boolean;
  switchMode: string | null;
  actions: string[] | null;
  memoryUpdate: { key: string; value: string } | null;
}

const MODULE_MAP: Record<
  string,
  { type: string; title: string; w: string; h: string; data?: any }
> = {
  budget: { type: "budget", title: "Budget Tracker", w: "2", h: "1" },
  fleet: { type: "fleet", title: "Fleet Overview", w: "2", h: "2" },
  notes: { type: "notes", title: "Quick Notes", w: "2", h: "2" },
  kpi: {
    type: "kpi",
    title: "KPI Widget",
    w: "1",
    h: "1",
    data: { value: "0", label: "New Metric", icon: "activity", color: "blue" },
  },
  task: { type: "tasks", title: "Tasks", w: "2", h: "2" },
  calendar: { type: "calendar", title: "Calendar", w: "2", h: "2" },
  crm: { type: "crm", title: "CRM Contacts", w: "2", h: "1" },
  contact: { type: "crm", title: "CRM Contacts", w: "2", h: "1" },
  habit: { type: "habits", title: "Daily Habits", w: "1", h: "2" },
  booking: { type: "bookings", title: "Bookings", w: "2", h: "2" },
  maintenance: {
    type: "maintenance",
    title: "Maintenance Tracker",
    w: "2",
    h: "2",
  },
  financial: { type: "financial", title: "Financial Snapshot", w: "2", h: "1" },
  "quick action": {
    type: "quick-actions",
    title: "Quick Actions",
    w: "2",
    h: "1",
  },
  overview: { type: "daily-overview", title: "Daily Overview", w: "4", h: "1" },
  checkin: { type: "checkin", title: "Check-In / Check-Out", w: "2", h: "2" },
  "check-in": {
    type: "checkin",
    title: "Check-In / Check-Out",
    w: "2",
    h: "2",
  },
};

function runDeterministicFallback(
  command: string,
  context: AssistantContext,
): AssistantResult {
  const cmd = command.toLowerCase();
  const result: AssistantResult = {
    response: "",
    moduleToAdd: null,
    proposedAction: null,
    workflow: null,
    generativeUI: null,
    clearDashboard: false,
    switchMode: null,
    actions: null,
    memoryUpdate: null,
  };

  if (cmd.includes("add") || cmd.includes("create") || cmd.includes("new")) {
    for (const [keyword, mod] of Object.entries(MODULE_MAP)) {
      if (cmd.includes(keyword)) {
        result.moduleToAdd = mod;
        result.response = `Added "${mod.title}" module to your dashboard.`;
        return result;
      }
    }
  }

  if (cmd.includes("add vehicle") || cmd.includes("new vehicle")) {
    result.proposedAction = {
      type: "create-vehicle",
      label: "Add Vehicle",
      payload: { make: "New", model: "Vehicle", status: "available" },
    };
    result.response =
      "I can help you add a new vehicle. Please confirm the details.";
    return result;
  }

  if (
    cmd.includes("clear") ||
    cmd.includes("reset dashboard") ||
    cmd.includes("remove all")
  ) {
    result.clearDashboard = true;
    result.response = "Dashboard cleared.";
    return result;
  }

  if (cmd.includes("switch to") || cmd.includes("change to")) {
    if (cmd.includes("personal")) result.switchMode = "personal";
    if (cmd.includes("professional")) result.switchMode = "professional";
    if (cmd.includes("rental")) result.switchMode = "rental";

    if (result.switchMode) {
      result.response = `Switched to ${result.switchMode} mode.`;
      return result;
    }
  }

  result.response =
    "I can help you customize your workspace or manage your fleet.";
  return result;
}

const SYSTEM_PROMPT = `You are the Workspace Intelligence layer for Nexus OS.
You have access to the user's real-time data provided in the CURRENT WORKSPACE CONTEXT.

Your goal is to be a precise operational partner.
1. Use the context to answer questions precisely.
2. Propose 'mutation' actions for single entity changes.
3. Use 'workflow' actions for multi-step sequences.
4. Use 'sdui' to render specialized components (YieldRecommendation, InspectionFindings).
5. Always wrap JSON actions in <action>...</action> tags.

Valid action shapes:
  {"type":"add-module","moduleType":"<type>","title":"<title>","w":"<1-4>","h":"<1-2>"}
  {"type":"mutation","mutationType":"create-vehicle|update-vehicle|create-customer|create-booking|create-task|create-note","payload":{...},"label":"Label","id":"<id>"}
  {"type":"workflow","steps":[{"type":"create-customer","payload":{...}}, {"type":"create-booking","payload":{...}}]}
  {"type":"sdui","component":"YieldRecommendation|InspectionFindings","props":{...}}

Rules:
- Be concise.
- If source is 'voice', be extremely brief.
- Prioritize mutations and SDUI over text chat.`;

async function callOpenAI(messages: any[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ||
    "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content ?? "";
}

function parseOpenAIResponse(raw: string): AssistantResult {
  const result: AssistantResult = {
    response: raw,
    moduleToAdd: null,
    proposedAction: null,
    workflow: null,
    generativeUI: null,
    clearDashboard: false,
    switchMode: null,
    actions: null,
    memoryUpdate: null,
  };

  const actionMatch = raw.match(/<action>([\s\S]*?)<\/action>/i);
  if (!actionMatch) return result;

  result.response = raw.replace(/<action>[\s\S]*?<\/action>/i, "").trim();

  try {
    const action = JSON.parse(actionMatch[1].trim());
    if (action.type === "add-module") {
      result.moduleToAdd = {
        type: action.moduleType,
        title: action.title,
        w: action.w,
        h: action.h,
      };
    } else if (action.type === "mutation") {
      result.proposedAction = {
        type: action.mutationType,
        payload: action.payload,
        id: action.id,
        label: action.label,
      };
    } else if (action.type === "workflow") {
      result.workflow = action.steps;
    } else if (action.type === "sdui") {
      result.generativeUI = { type: action.component, props: action.props };
    }
  } catch {}
  return result;
}

export async function processMessage(
  command: string,
  context: AssistantContext,
  source: "text" | "voice" = "text",
): Promise<AssistantResult> {
  const provider = (process.env.AI_PROVIDER || "none").toLowerCase();

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    try {
      const workspaceContext = await getWorkspaceContext(
        context.userId,
        command,
      );
      const messages = [
        {
          role: "system",
          content:
            SYSTEM_PROMPT +
            (source === "voice"
              ? "\nNOTE: User is speaking via voice. Keep textual response under 10 words."
              : ""),
        },
        { role: "system", content: workspaceContext },
        { role: "user", content: command },
      ];
      const raw = await callOpenAI(messages);
      return parseOpenAIResponse(raw);
    } catch (err) {
      console.error("[model-gateway] OpenAI call failed:", err);
    }
  }

  return runDeterministicFallback(command, context);
}

export { runDeterministicFallback as processAssistantCommand };
