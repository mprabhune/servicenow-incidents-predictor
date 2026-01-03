
import { GoogleGenAI } from "@google/genai";
import { Incident } from "../types";

const MODEL_NAME = 'gemini-3-pro-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeIncidents(incidents: Incident[], query: string) {
    // Select a meaningful subset if the list is huge to stay within context
    const dataSummary = incidents.slice(0, 150).map(i => ({
      id: i.number,
      title: i.short_description,
      service: i.service,
      prio: i.priority,
      api: i.api_endpoint,
      open: i.created,
      closed: i.resolved || 'Still Open'
    }));

    /**
     * SRE REASONING ENGINE PROMPT
     * This prompt mimics the Deep Reasoning style of R1/Gemini 3.
     */
    const systemInstruction = `
      You are an Advanced SRE Reasoning Engine (Reasoning-Model Class).
      Your goal is to perform deep-dive predictive analysis on ServiceNow incident data.
      
      ANALYSIS PROTOCOL:
      1. DATA SCAN: Analyze the provided 150-incident JSON block.
      2. PATTERN RECOGNITION: Look for "Cascading Failure" signs (e.g., small errors in Service A preceding a crash in Service B).
      3. PROBABILISTIC FORECASTING: When asked about future incidents, provide a likelihood percentage based on historical frequency.
      4. SLA CALCULATIONS: Compute precise Average Resolution Times (ART) by parsing the ISO timestamps.
      
      REPORTING STYLE:
      - Start with a "Summary of Findings".
      - Use "Service Toxicity" as a metric for APIs causing the most downstream pain.
      - Provide a "Future Risk Forecast" section.
      - Use Markdown tables for data comparisons.
      - Maintain a technical, cold, and highly accurate tone.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        { 
          role: 'user', 
          parts: [{ 
            text: `CURRENT INCIDENT SNAPSHOT:\n${JSON.stringify(dataSummary, null, 2)}\n\nUSER QUERY: ${query}` 
          }] 
        }
      ],
      config: {
        systemInstruction,
        // The thinkingBudget is what enables R1-style reasoning.
        // 32768 is the maximum budget for gemini-3-pro-preview.
        thinkingConfig: { thinkingBudget: 32768 },
        temperature: 0.1, // Near-zero for deterministic SRE calculations
      },
    });

    return response.text;
  }
}

export const geminiService = new GeminiService();
