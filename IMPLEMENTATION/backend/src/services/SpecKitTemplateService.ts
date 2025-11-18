import axios from 'axios';
import { SpecKitTemplate, TemplateSet } from '../types';

/**
 * Service for fetching spec-kit templates from GitHub
 * Based on: https://github.com/github/spec-kit
 */
export class SpecKitTemplateService {
  private readonly baseUrl = 'https://raw.githubusercontent.com/github/spec-kit/main/templates';
  private templateCache: Map<string, string> = new Map();

  /**
   * Fetch a single template from GitHub
   */
  async fetchTemplate(templateName: string): Promise<string> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const url = `${this.baseUrl}/${templateName}`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'text/plain',
        },
        timeout: 10000
      });

      const content = response.data;
      this.templateCache.set(templateName, content);
      return content;
    } catch (error) {
      console.error(`Failed to fetch template ${templateName}:`, error);
      throw new Error(`Could not fetch template ${templateName} from GitHub`);
    }
  }

  /**
   * Fetch all spec-kit templates
   */
  async fetchAllTemplates(): Promise<TemplateSet> {
    const templates = {
      'spec-template.md': await this.fetchTemplate('spec-template.md'),
      'plan-template.md': await this.fetchTemplate('plan-template.md'),
      'tasks-template.md': await this.fetchTemplate('tasks-template.md'),
      'implement-template.md': await this.fetchTemplate('implement-template.md'),
    };

    return templates;
  }

  /**
   * Get the spec template adapted for SpecForge
   * This template will be used to initialize speckit.specify and speckit.constitution
   */
  async getSpecTemplate(): Promise<string> {
    return await this.fetchTemplate('spec-template.md');
  }

  /**
   * Get the plan template for speckit.plan
   */
  async getPlanTemplate(): Promise<string> {
    return await this.fetchTemplate('plan-template.md');
  }

  /**
   * Get the tasks template for speckit.tasks
   */
  async getTasksTemplate(): Promise<string> {
    return await this.fetchTemplate('tasks-template.md');
  }

  /**
   * Get the implement template for speckit.implement
   */
  async getImplementTemplate(): Promise<string> {
    return await this.fetchTemplate('implement-template.md');
  }

  /**
   * List available templates
   */
  getAvailableTemplates(): SpecKitTemplate[] {
    return [
      {
        name: 'spec-template.md',
        content: '',
        url: `${this.baseUrl}/spec-template.md`
      },
      {
        name: 'plan-template.md',
        content: '',
        url: `${this.baseUrl}/plan-template.md`
      },
      {
        name: 'tasks-template.md',
        content: '',
        url: `${this.baseUrl}/tasks-template.md`
      },
      {
        name: 'implement-template.md',
        content: '',
        url: `${this.baseUrl}/implement-template.md`
      }
    ];
  }

  /**
   * Clear template cache (useful for testing or forcing refresh)
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Generate initial speckit.specify content based on spec-template
   */
  async generateInitialSpecifyContent(): Promise<string> {
    const template = await this.getSpecTemplate();

    // Add header explaining this file contains functional specifications
    const header = `# Functional Specifications

This file contains the functional specifications for this project, including:
- User Stories
- Functional Requirements
- Success Criteria

Based on spec-kit template: https://github.com/github/spec-kit

---

`;

    return header + template;
  }

  /**
   * Generate initial speckit.constitution content
   */
  async generateInitialConstitutionContent(): Promise<string> {
    const template = await this.getSpecTemplate();

    // Add header explaining this file contains non-functional specifications
    const header = `# Non-Functional Specifications (Constitution)

This file contains the non-functional requirements and constraints for this project.

Based on spec-kit template: https://github.com/github/spec-kit

---

`;

    return header + template;
  }
}
