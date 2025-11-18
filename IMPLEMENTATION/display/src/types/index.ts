// SpecForge Frontend Types

export enum SpecificationType {
  USER_STORY = 'USER_STORY',
  FUNCTIONAL = 'FUNCTIONAL',
  SUCCESS_CRITERIA = 'SUCCESS_CRITERIA',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL'
}

export type InputType = 'userStory' | 'functional' | 'successCriteria' | 'nonFunctional';

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
}

export interface Project {
  path: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResponse {
  specifications: Specification[];
  summary: string;
  tokenUsage?: TokenUsage;
  stats: {
    saved: number;
    duplicates: number;
    total: number;
  };
}

export interface QueueItem {
  id: string;
  text: string;
  inputType: InputType;
  projectPath: string;
  promptId?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: AnalysisResponse;
  error?: string;
}

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  userStory: 'User Story',
  functional: 'Functional Requirement',
  successCriteria: 'Success Criteria',
  nonFunctional: 'Non-Functional Requirement'
};

export const INPUT_TYPE_DESCRIPTIONS: Record<InputType, string> = {
  userStory: 'Describe user needs and goals',
  functional: 'Define system behavior and features',
  successCriteria: 'Specify measurable acceptance criteria',
  nonFunctional: 'Define quality attributes and constraints'
};

export const INPUT_TYPE_ICONS: Record<InputType, string> = {
  userStory: '👤',
  functional: '⚙️',
  successCriteria: '✓',
  nonFunctional: '📊'
};

export const SPECIFICATION_TYPE_ICONS: Record<SpecificationType, string> = {
  USER_STORY: '👤',
  FUNCTIONAL: '⚙️',
  SUCCESS_CRITERIA: '✓',
  NON_FUNCTIONAL: '📊'
};
