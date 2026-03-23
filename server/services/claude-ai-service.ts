/**
 * Claude AI Service — Anthropic API integration with extended thinking.
 * Gracefully falls back when ANTHROPIC_API_KEY is not set.
 */

import { env } from "../config";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | Array<{ type: string; text?: string; [k: string]: any }>;
}

interface ClaudeResponse {
  id: string;
  content: Array<{ type: string; text?: string; thinking?: string }>;
  usage: { input_tokens: number; output_tokens: number };
  stop_reason: string;
}

export class ClaudeAIService {
  private apiKey: string | undefined;
  private model: string;

  constructor() {
    this.apiKey = env.ANTHROPIC_API_KEY;
    this.model = env.ANTHROPIC_MODEL;
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Standard chat completion — used by the model gateway.
   */
  async chat(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Anthropic API expects system as a separate parameter
    const claudeMessages: ClaudeMessage[] = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Combine any additional system messages into the system prompt
    const extraSystem = messages
      .filter((m) => m.role === "system" && m.content !== systemPrompt)
      .map((m) => m.content)
      .join("\n\n");

    const fullSystem = extraSystem
      ? `${systemPrompt}\n\n${extraSystem}`
      : systemPrompt;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: fullSystem,
        messages: claudeMessages,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(
        `Claude API error: ${response.status} ${errBody.slice(0, 200)}`,
      );
    }

    const data = (await response.json()) as ClaudeResponse;
    const textBlock = data.content.find((b) => b.type === "text");
    return textBlock?.text ?? "";
  }

  /**
   * Extended thinking — for complex analysis tasks.
   */
  async thinkAndRespond(
    prompt: string,
    context: Record<string, any>,
    budgetTokens = 5000,
  ): Promise<{ thinking: string; response: string }> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const systemPrompt = `You are an advanced AI assistant for the Adaptive Business Suite.
${JSON.stringify(context, null, 2)}

Provide comprehensive analysis with actionable recommendations.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 16000,
        system: systemPrompt,
        thinking: {
          type: "enabled",
          budget_tokens: budgetTokens,
        },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`Claude API error: ${response.status} ${errBody.slice(0, 200)}`);
    }

    const data = (await response.json()) as ClaudeResponse;

    let thinking = "";
    let responseText = "";

    for (const block of data.content) {
      if (block.type === "thinking" && block.thinking) {
        thinking = block.thinking;
      } else if (block.type === "text" && block.text) {
        responseText = block.text;
      }
    }

    return { thinking, response: responseText };
  }

  /**
   * Vision analysis — for vehicle inspection images.
   */
  async analyzeImage(
    imageBase64: string,
    prompt: string,
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg",
  ): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude Vision error: ${response.status}`);
    }

    const data = (await response.json()) as ClaudeResponse;
    const textBlock = data.content.find((b) => b.type === "text");
    return textBlock?.text ?? "";
  }
}

export const claudeAI = new ClaudeAIService();
