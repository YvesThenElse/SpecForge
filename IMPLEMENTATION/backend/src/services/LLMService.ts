import OpenAI from 'openai';
import { Specification, SpecificationType, Priority, Status, TokenUsage, InputType } from '../types';
import { FileService } from './FileService';
import { PromptService } from './PromptService';
import { TokenTrackingService } from './TokenTrackingService';

export class LLMService {
  private openai: OpenAI;
  private fileService: FileService;
  private promptService: PromptService;
  private tokenTracker: TokenTrackingService;
  private lastTokenUsage?: TokenUsage;

  constructor(apiKey: string, fileService: FileService) {
    this.openai = new OpenAI({ apiKey });
    this.fileService = fileService;
    this.promptService = new PromptService();
    this.tokenTracker = new TokenTrackingService();
  }

  getLastTokenUsage(): TokenUsage | undefined {
    return this.lastTokenUsage;
  }

  private getPromptTemplate(promptId: string, text: string): string {
    const promptContent = this.promptService.getPromptContent(promptId);

    if (!promptContent) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // Replace {{TEXT}} placeholder with actual text
    return promptContent.replace(/\{\{TEXT\}\}/g, text);
  }

  /**
   * Map InputType to SpecificationType
   */
  private mapInputTypeToSpecType(inputType: InputType): SpecificationType {
    switch (inputType) {
      case 'userStory':
        return SpecificationType.USER_STORY;
      case 'functional':
        return SpecificationType.FUNCTIONAL;
      case 'successCriteria':
        return SpecificationType.SUCCESS_CRITERIA;
      case 'nonFunctional':
        return SpecificationType.NON_FUNCTIONAL;
      default:
        return SpecificationType.USER_STORY;
    }
  }

  /**
   * Analyze text and extract specifications using LLM
   */
  async analyzeText(
    text: string,
    projectPath: string,
    inputType: InputType,
    promptId?: string
  ): Promise<Specification[]> {
    // Generate prompt based on promptId or fallback to input type
    let prompt: string;

    if (promptId) {
      // Use the specified prompt
      prompt = this.getPromptTemplate(promptId, text);
    } else {
      // Use default prompt based on input type
      const promptMapping: Record<InputType, string> = {
        'userStory': 'analysis-user-story',
        'functional': 'analysis-functional',
        'successCriteria': 'analysis-success-criteria',
        'nonFunctional': 'analysis-non-functional'
      };

      const defaultPromptId = promptMapping[inputType] || 'analysis-user-story';
      prompt = this.getPromptTemplate(defaultPromptId, text);
    }

    const systemPrompt = `You are a specification engineering expert following the spec-kit methodology.
Extract specifications from the provided text in the following JSON format:
[
  {
    "type": "USER_STORY" | "FUNCTIONAL" | "SUCCESS_CRITERIA" | "NON_FUNCTIONAL",
    "title": "Brief title",
    "description": "Detailed description",
    "rationale": "Why this specification exists",
    "priority": "critical" | "high" | "medium" | "low"
  }
]
Return only valid JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      // Capture token usage
      if (response.usage) {
        const costPer1kInput = 0.03; // GPT-4 pricing (approximate)
        const costPer1kOutput = 0.06;
        const estimatedCost =
          (response.usage.prompt_tokens / 1000) * costPer1kInput +
          (response.usage.completion_tokens / 1000) * costPer1kOutput;

        this.lastTokenUsage = {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          model: 'gpt-4',
          estimatedCost: Math.round(estimatedCost * 10000) / 10000 // Round to 4 decimals
        };

        // Log token usage
        const operationType = `${inputType} Analysis`;

        // Get project config to get project ID for tracking
        const config = this.fileService.getProjectConfig(projectPath);
        if (config) {
          this.tokenTracker.logUsage(
            config.projectId,
            'analysis',
            operationType,
            response.usage.prompt_tokens,
            response.usage.completion_tokens,
            'gpt-4',
            this.lastTokenUsage.estimatedCost
          );
        }
      }

      const content = response.choices[0]?.message?.content || '[]';

      // Extract JSON from markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }

      const parsedSpecifications = JSON.parse(jsonContent);

      // Transform to full Specification objects
      const specifications: Specification[] = parsedSpecifications.map((spec: any) => {
        // Generate ID using FileService
        const specType = spec.type as SpecificationType;
        const id = this.fileService.generateNextSpecificationId(projectPath, specType);

        return {
          id,
          type: specType,
          title: spec.title,
          description: spec.description,
          rationale: spec.rationale,
          priority: spec.priority as Priority,
          status: Status.DRAFT,
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          tokenUsage: this.lastTokenUsage
        };
      });

      return specifications;
    } catch (error) {
      console.error('LLM Analysis Error:', error);
      throw new Error('Failed to analyze text with LLM');
    }
  }

  /**
   * Generate a summary of specifications
   */
  async generateSummary(specifications: Specification[]): Promise<string> {
    const prompt = `Generate a brief summary (2-3 sentences) of the following specifications:

${specifications.map((spec, i) => `${i + 1}. [${spec.type}] ${spec.title}: ${spec.description}`).join('\n')}

Summary:`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      return response.choices[0]?.message?.content || 'No summary available';
    } catch (error) {
      console.error('Summary Generation Error:', error);
      return 'Summary generation failed';
    }
  }

  /**
   * Check for duplicate specifications using similarity scoring
   */
  calculateSimilarity(spec1: Specification, spec2: Specification): number {
    // Simple Dice coefficient similarity for titles
    const title1 = spec1.title.toLowerCase();
    const title2 = spec2.title.toLowerCase();

    const words1 = new Set(title1.split(/\s+/));
    const words2 = new Set(title2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));

    return (2 * intersection.size) / (words1.size + words2.size);
  }

  /**
   * Find similar specifications in existing project
   */
  findSimilarSpecifications(
    newSpec: Specification,
    existingSpecs: Specification[],
    threshold: number = 0.7
  ): Specification[] {
    return existingSpecs
      .map(existing => ({
        spec: existing,
        similarity: this.calculateSimilarity(newSpec, existing)
      }))
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(result => result.spec);
  }
}
