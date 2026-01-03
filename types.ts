
export interface Incident {
  number: string;
  short_description: string;
  description?: string;
  service: string;
  api_endpoint?: string;
  priority: string;
  state: string;
  created: string;
  resolved?: string;
  assignment_group?: string;
  sla_due?: string;
  duration_minutes?: number;
}

export interface AnalysisResponse {
  summary: string;
  predictions: {
    incidentType: string;
    probability: number;
    reasoning: string;
  }[];
  riskyServices: {
    service: string;
    riskScore: number;
    explanation: string;
  }[];
  slaMetrics: {
    averageResolutionTime: string;
    slaComplianceRate: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
