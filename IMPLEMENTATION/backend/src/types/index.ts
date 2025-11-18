// SpecForge Specification Types (based on spec-kit)
export enum SpecificationType {
  USER_STORY = 'USER_STORY',
  FUNCTIONAL = 'FUNCTIONAL',
  SUCCESS_CRITERIA = 'SUCCESS_CRITERIA',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL'
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum Status {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  IMPLEMENTED = 'implemented',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  estimatedCost: number;
}

export interface SpecificationMatch {
  existingSpecification: Specification;
  similarityScore: number;
  matchType: 'certain' | 'probable' | 'possible';
}

export interface Specification {
  id: string;
  type: SpecificationType;
  title: string;
  description: string;
  rationale?: string;
  priority: Priority;
  status: Status;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
  tokenUsage?: TokenUsage;
  matchedSpecification?: SpecificationMatch;
}

// Project structure for SpecForge
export interface Project {
  path: string;              // Absolute path to project directory
  name: string;              // Project name (derived from directory name)
  description?: string;      // Optional description
  createdAt: string;
  updatedAt: string;
}

// SpecKit file structure
export interface SpecKitFiles {
  specify: Specification[];     // USER_STORY, FUNCTIONAL, SUCCESS_CRITERIA
  constitution: Specification[]; // NON_FUNCTIONAL
  plan: string;                  // Markdown content
  tasks: string;                 // Markdown content
  implement: string;             // Markdown content
}

// Backend configuration stored in .specforge
export interface SpecForgeConfig {
  projectId: string;            // Internal project ID
  initialized: boolean;
  templateVersion?: string;
  lastSync?: string;
  counters: Record<SpecificationType, number>;
}

export type InputType = 'userStory' | 'functional' | 'successCriteria' | 'nonFunctional';

export interface AnalysisRequest {
  text: string;
  projectPath: string;
  inputType: InputType;
  promptId?: string;
}

export interface AnalysisResponse {
  specifications: Specification[];
  summary: string;
  tokenUsage?: TokenUsage;
}

// Template structure from GitHub spec-kit
export interface SpecKitTemplate {
  name: string;
  content: string;
  url: string;
}

export interface TemplateSet {
  'spec-template.md': string;
  'plan-template.md': string;
  'tasks-template.md': string;
  'implement-template.md': string;
}
