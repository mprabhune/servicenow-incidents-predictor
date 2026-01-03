
import { Incident } from "../types";

export class OllamaService {
  // Use 127.0.0.1 instead of localhost to avoid some DNS resolution issues in browsers
  private baseUrl: string = "http://127.0.0.1:11434/api/chat";

  async checkConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch("http://127.0.0.1:11434/api/tags", { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyzeIncidents(incidents: Incident[], query: string, modelName: string = "deepseek-r1") {
    const dataSummary = incidents.slice(0, 40).map(i => ({
      id: i.number,
      title: i.short_description,
      service: i.service,
      prio: i.priority,
      api: i.api_endpoint,
      open: i.created,
      closed: i.resolved || 'Still Open'
    }));

    const systemPrompt = `
      You are an Advanced SRE Reasoning Engine running on DeepSeek R1.
      Analyze the provided ServiceNow incident data. Respond in Markdown.
      Provide a "Thinking" section and an "Analysis" section.
    `;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `DATA:\n${JSON.stringify(dataSummary)}\n\nUSER QUESTION: ${query}` }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result.message.content;
    } catch (err: any) {
      console.error("Ollama connection error:", err);
      if (err.name === 'AbortError' || err.message.includes('Failed to fetch')) {
        throw new Error("CORS_OR_NETWORK_FAILURE");
      }
      throw err;
    }
  }
}

export const ollamaService = new OllamaService();
