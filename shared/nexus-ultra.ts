export type NexusSignal = "healthy" | "attention" | "critical" | "planned";
export type NexusComplianceStatus =
  | "COMPLIANT"
  | "IN_PROGRESS"
  | "NOT_APPLICABLE";

export interface NexusMetric {
  label: string;
  value: string;
  detail: string;
  signal: NexusSignal;
}

export interface NexusArchitectureLayer {
  title: string;
  summary: string;
  capabilities: string[];
}

export interface NexusProgram {
  title: string;
  summary: string;
  automation: string;
}

export interface NexusGate {
  id: string;
  purpose: string;
  tools: string[];
  stack: string;
  sla: string;
  autoFix: string;
}

export interface NexusFramework {
  name: string;
  status: NexusComplianceStatus;
  score: string;
  controls: string[];
}

export interface NexusIntegration {
  name: string;
  category: string;
  capability: string;
  automation: string;
}

export interface NexusFeatureList {
  title: string;
  items: string[];
}

export interface NexusDeploymentPhase {
  phase: string;
  title: string;
  summary: string;
  deliverables: string[];
}

export interface NexusUltraPayload {
  product: {
    name: string;
    version: string;
    releaseDate: string;
    status: string;
    headline: string;
    outcome: string;
    deploymentCommand: string;
  };
  highlights: string[];
  heroMetrics: NexusMetric[];
  executiveMetrics: NexusMetric[];
  architecture: NexusArchitectureLayer[];
  intelligence: NexusProgram[];
  gates: {
    critical: NexusGate[];
    release: NexusGate[];
    continuous: NexusGate[];
  };
  compliance: NexusFramework[];
  cloudTargets: NexusFeatureList[];
  integrations: NexusIntegration[];
  supplyChain: NexusFeatureList[];
  selfHealing: NexusFeatureList[];
  deployment: NexusDeploymentPhase[];
  recommendations: string[];
}
