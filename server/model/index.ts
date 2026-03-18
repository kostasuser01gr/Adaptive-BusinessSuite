/**
 * Model gateway — provider-agnostic AI layer.
 *
 * Supported providers (set via env vars):
 *   AI_PROVIDER=none        (default) — deterministic rule-based fallback
 *   AI_PROVIDER=openai      — OpenAI chat completions (requires OPENAI_API_KEY)
 *
 * Optional env vars for OpenAI:
 *   OPENAI_API_KEY          — API key
 *   OPENAI_MODEL            — model name, default "gpt-4o-mini"
 *   OPENAI_BASE_URL         — custom base URL for compatible APIs (e.g. local Ollama)
 */

export interface AssistantContext {
  mode: string;
  moduleTypes: string[];
  vehicleCount?: number;
  bookingCount?: number;
  taskCount?: number;
}

export interface AssistantResult {
  response: string;
  moduleToAdd: { type: string; title: string; w: string; h: string; data?: any } | null;
  clearDashboard: boolean;
  switchMode: string | null;
  actions: string[] | null;
  memoryUpdate: { key: string; value: string } | null;
}

// ── Deterministic (rule-based) provider ──────────────────────────────────────

const MODULE_MAP: Record<string, { type: string; title: string; w: string; h: string; data?: any }> = {
  budget:         { type: 'budget',         title: 'Budget Tracker',           w: '2', h: '1' },
  fleet:          { type: 'fleet',          title: 'Fleet Overview',            w: '2', h: '2' },
  notes:          { type: 'notes',          title: 'Quick Notes',               w: '2', h: '2' },
  kpi:            { type: 'kpi',            title: 'KPI Widget',                w: '1', h: '1', data: { value: '0', label: 'New Metric', icon: 'activity', color: 'blue' } },
  task:           { type: 'tasks',          title: 'Tasks',                     w: '2', h: '2' },
  calendar:       { type: 'calendar',       title: 'Calendar',                  w: '2', h: '2' },
  crm:            { type: 'crm',            title: 'CRM Contacts',              w: '2', h: '1' },
  contact:        { type: 'crm',            title: 'CRM Contacts',              w: '2', h: '1' },
  habit:          { type: 'habits',         title: 'Daily Habits',              w: '1', h: '2' },
  booking:        { type: 'bookings',       title: 'Bookings',                  w: '2', h: '2' },
  maintenance:    { type: 'maintenance',    title: 'Maintenance Tracker',       w: '2', h: '2' },
  financial:      { type: 'financial',      title: 'Financial Snapshot',        w: '2', h: '1' },
  'quick action': { type: 'quick-actions',  title: 'Quick Actions',             w: '2', h: '1' },
  overview:       { type: 'daily-overview', title: 'Daily Overview',            w: '4', h: '1' },
  checkin:        { type: 'checkin',        title: 'Check-In / Check-Out',      w: '2', h: '2' },
  'check-in':     { type: 'checkin',        title: 'Check-In / Check-Out',      w: '2', h: '2' },
};

type UserMode = 'rental' | 'personal' | 'professional' | 'custom';
const MODE_MAP: Record<string, UserMode> = {
  personal:     'personal',
  rental:       'rental',
  car:          'rental',
  professional: 'professional',
  work:         'professional',
};

function runDeterministicFallback(command: string, context: AssistantContext): AssistantResult {
  const cmd = command.toLowerCase();
  const result: AssistantResult = {
    response: '',
    moduleToAdd: null,
    clearDashboard: false,
    switchMode: null,
    actions: null,
    memoryUpdate: null,
  };

  if (cmd.includes('add') || cmd.includes('create') || cmd.includes('new')) {
    for (const [keyword, mod] of Object.entries(MODULE_MAP)) {
      if (cmd.includes(keyword)) {
        result.moduleToAdd = mod;
        result.response = `Added "${mod.title}" module to your dashboard.`;
        result.memoryUpdate = { key: 'last_added_module', value: mod.type };
        return result;
      }
    }
  }

  if (cmd.includes('remove all') || cmd.includes('clear') || cmd.includes('reset dashboard')) {
    result.clearDashboard = true;
    result.response = 'Dashboard cleared. Tell me what modules you want and I will build your ideal workspace.';
    return result;
  }

  for (const [keyword, mode] of Object.entries(MODE_MAP)) {
    if (cmd.includes(keyword) && (cmd.includes('switch') || cmd.includes('mode') || cmd.includes('change'))) {
      result.switchMode = mode;
      result.response = `Switched to ${mode} mode. Dashboard has been reconfigured with ${mode} modules.`;
      result.memoryUpdate = { key: 'preferred_mode', value: mode };
      return result;
    }
  }

  const suggestions: string[] = [];
  if (context.mode === 'rental') {
    if (!context.moduleTypes.includes('fleet'))       suggestions.push('Add Fleet Overview');
    if (!context.moduleTypes.includes('bookings'))    suggestions.push('Add Bookings');
    if (!context.moduleTypes.includes('checkin'))     suggestions.push('Add Check-In/Out');
    if (!context.moduleTypes.includes('maintenance')) suggestions.push('Add Maintenance Tracker');
  }
  if (!context.moduleTypes.includes('tasks')) suggestions.push('Add Tasks');
  if (!context.moduleTypes.includes('notes')) suggestions.push('Add Notes');

  result.response =
    'I can customize your workspace in many ways. Try:\n' +
    '• "Add [module name]" — fleet, bookings, tasks, notes, budget, calendar, CRM, maintenance, check-in, financial, KPI\n' +
    '• "Switch to [mode]" — rental, personal, professional\n' +
    '• "Clear dashboard" — start fresh\n\n' +
    'I can also add custom KPI widgets, quick actions, and more.';
  result.actions = suggestions.slice(0, 4);
  return result;
}

// ── OpenAI provider ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the workspace assistant for Nexus OS, an adaptive business operating system.
You help operators manage their fleet, bookings, customers, maintenance, tasks and notes.

When the user asks to add a module, respond with a JSON action block and a short friendly confirmation.
When the user asks to switch modes (rental/personal/professional), respond with a JSON action block.
Otherwise give a short, practical answer (max 3 sentences).

If you produce a JSON action, wrap it in <action>...</action> tags.
Valid action shapes:
  {"type":"add-module","moduleType":"<type>","title":"<title>","w":"<1-4>","h":"<1-2>"}
  {"type":"switch-mode","mode":"rental|personal|professional"}
  {"type":"clear-dashboard"}

Available module types: fleet, bookings, tasks, notes, budget, calendar, crm, habits,
maintenance, financial, quick-actions, daily-overview, checkin, kpi.
Keep w/h reasonable (w 1-4, h 1-2).`;

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callOpenAI(messages: OpenAIChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const baseUrl = process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const model   = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 512, temperature: 0.4 }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content ?? '';
}

function parseOpenAIResponse(raw: string, context: AssistantContext): AssistantResult {
  const result: AssistantResult = {
    response: raw,
    moduleToAdd: null,
    clearDashboard: false,
    switchMode: null,
    actions: null,
    memoryUpdate: null,
  };

  // Extract optional <action> block
  const actionMatch = raw.match(/<action>([\s\S]*?)<\/action>/i);
  if (!actionMatch) return result;

  // Strip the action tag from the visible response
  result.response = raw.replace(/<action>[\s\S]*?<\/action>/i, '').trim();

  try {
    const action = JSON.parse(actionMatch[1].trim());

    if (action.type === 'add-module') {
      result.moduleToAdd = {
        type:  action.moduleType || 'custom',
        title: action.title      || 'Module',
        w:     String(action.w   || '2'),
        h:     String(action.h   || '1'),
      };
      result.memoryUpdate = { key: 'last_added_module', value: result.moduleToAdd.type };
    } else if (action.type === 'switch-mode') {
      result.switchMode  = action.mode || null;
      result.memoryUpdate = { key: 'preferred_mode', value: action.mode };
    } else if (action.type === 'clear-dashboard') {
      result.clearDashboard = true;
    }
  } catch {
    // Malformed action JSON — surface the plain text response as-is
  }

  return result;
}

// ── Public gateway function ──────────────────────────────────────────────────

/**
 * Route a user message through the active AI provider.
 * Falls back to the deterministic rule engine when no live model is configured.
 */
export async function processMessage(command: string, context: AssistantContext): Promise<AssistantResult> {
  const provider = (process.env.AI_PROVIDER || 'none').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    try {
      const messages: OpenAIChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: command },
      ];
      const raw = await callOpenAI(messages);
      return parseOpenAIResponse(raw, context);
    } catch (err) {
      // Log and fall through to deterministic mode so the app never goes dark
      console.error('[model-gateway] OpenAI call failed, using deterministic fallback:', err);
    }
  }

  return runDeterministicFallback(command, context);
}

// Re-export the deterministic function for tests / direct use
export { runDeterministicFallback as processAssistantCommand };
