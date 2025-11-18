import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  Specification,
  SpecificationType,
  SpecForgeConfig,
  SpecKitFiles
} from '../types';
import { SpecKitTemplateService } from './SpecKitTemplateService';

/**
 * FileService for SpecForge
 * Manages speckit.* files in user project directories
 */
export class FileService {
  private templateService: SpecKitTemplateService;

  constructor() {
    this.templateService = new SpecKitTemplateService();
  }

  /**
   * Get the .specforge config file path for a project
   */
  private getConfigPath(projectPath: string): string {
    return path.join(projectPath, '.specforge');
  }

  /**
   * Get speckit file paths
   */
  private getSpecKitPaths(projectPath: string) {
    return {
      specify: path.join(projectPath, 'speckit.specify'),
      constitution: path.join(projectPath, 'speckit.constitution'),
      plan: path.join(projectPath, 'speckit.plan'),
      tasks: path.join(projectPath, 'speckit.tasks'),
      implement: path.join(projectPath, 'speckit.implement'),
    };
  }

  /**
   * Check if a project is initialized (has .specforge file)
   */
  isProjectInitialized(projectPath: string): boolean {
    return fs.existsSync(this.getConfigPath(projectPath));
  }

  /**
   * Initialize a new project with spec-kit templates
   */
  async initializeProject(projectPath: string, projectName?: string): Promise<Project> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory does not exist: ${projectPath}`);
    }

    // Create .specforge config
    const config: SpecForgeConfig = {
      projectId: uuidv4(),
      initialized: true,
      templateVersion: 'spec-kit-main',
      lastSync: new Date().toISOString(),
      counters: {
        [SpecificationType.USER_STORY]: 0,
        [SpecificationType.FUNCTIONAL]: 0,
        [SpecificationType.SUCCESS_CRITERIA]: 0,
        [SpecificationType.NON_FUNCTIONAL]: 0,
      }
    };

    fs.writeFileSync(
      this.getConfigPath(projectPath),
      JSON.stringify(config, null, 2)
    );

    // Fetch templates and create speckit files
    const paths = this.getSpecKitPaths(projectPath);

    try {
      // Initialize speckit.specify with template
      if (!fs.existsSync(paths.specify)) {
        const specifyContent = await this.templateService.generateInitialSpecifyContent();
        fs.writeFileSync(paths.specify, specifyContent);
      }

      // Initialize speckit.constitution with template
      if (!fs.existsSync(paths.constitution)) {
        const constitutionContent = await this.templateService.generateInitialConstitutionContent();
        fs.writeFileSync(paths.constitution, constitutionContent);
      }

      // Initialize speckit.plan
      if (!fs.existsSync(paths.plan)) {
        const planContent = await this.templateService.getPlanTemplate();
        fs.writeFileSync(paths.plan, planContent);
      }

      // Initialize speckit.tasks
      if (!fs.existsSync(paths.tasks)) {
        const tasksContent = await this.templateService.getTasksTemplate();
        fs.writeFileSync(paths.tasks, tasksContent);
      }

      // Initialize speckit.implement
      if (!fs.existsSync(paths.implement)) {
        const implementContent = await this.templateService.getImplementTemplate();
        fs.writeFileSync(paths.implement, implementContent);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Create empty files if template fetch fails
      Object.values(paths).forEach(filePath => {
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '# SpecForge File\n\n');
        }
      });
    }

    const name = projectName || path.basename(projectPath);

    return {
      path: projectPath,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get project configuration
   */
  getProjectConfig(projectPath: string): SpecForgeConfig | null {
    const configPath = this.getConfigPath(projectPath);

    if (!fs.existsSync(configPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  /**
   * Save project configuration
   */
  saveProjectConfig(projectPath: string, config: SpecForgeConfig): void {
    fs.writeFileSync(
      this.getConfigPath(projectPath),
      JSON.stringify(config, null, 2)
    );
  }

  /**
   * Read all speckit files
   */
  readSpecKitFiles(projectPath: string): SpecKitFiles {
    const paths = this.getSpecKitPaths(projectPath);

    return {
      specify: this.parseSpecifications(paths.specify),
      constitution: this.parseSpecifications(paths.constitution),
      plan: fs.existsSync(paths.plan) ? fs.readFileSync(paths.plan, 'utf-8') : '',
      tasks: fs.existsSync(paths.tasks) ? fs.readFileSync(paths.tasks, 'utf-8') : '',
      implement: fs.existsSync(paths.implement) ? fs.readFileSync(paths.implement, 'utf-8') : '',
    };
  }

  /**
   * Parse specifications from a markdown file
   * This is a simple parser - can be enhanced based on spec-kit format
   */
  private parseSpecifications(filePath: string): Specification[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    // For now, return empty array
    // TODO: Implement markdown parsing based on spec-kit format
    // This would parse the markdown structure and extract specifications
    return [];
  }

  /**
   * Get all specifications from a project
   */
  getAllSpecifications(projectPath: string): Specification[] {
    const files = this.readSpecKitFiles(projectPath);
    return [...files.specify, ...files.constitution];
  }

  /**
   * Add a specification to the appropriate speckit file
   */
  addSpecification(projectPath: string, specification: Specification): void {
    const config = this.getProjectConfig(projectPath);
    if (!config) {
      throw new Error('Project not initialized');
    }

    // Determine which file to write to
    const isNonFunctional = specification.type === SpecificationType.NON_FUNCTIONAL;
    const filePath = isNonFunctional
      ? this.getSpecKitPaths(projectPath).constitution
      : this.getSpecKitPaths(projectPath).specify;

    // Append specification to file in markdown format
    const specMarkdown = this.formatSpecificationAsMarkdown(specification);
    fs.appendFileSync(filePath, '\n' + specMarkdown);

    // Update counter
    config.counters[specification.type]++;
    config.lastSync = new Date().toISOString();
    this.saveProjectConfig(projectPath, config);
  }

  /**
   * Format a specification as markdown
   */
  private formatSpecificationAsMarkdown(spec: Specification): string {
    return `
## ${spec.id}: ${spec.title}

**Type:** ${spec.type}
**Priority:** ${spec.priority}
**Status:** ${spec.status}

${spec.description}

${spec.rationale ? `**Rationale:** ${spec.rationale}\n` : ''}
${spec.tags && spec.tags.length > 0 ? `**Tags:** ${spec.tags.join(', ')}\n` : ''}

---
`;
  }

  /**
   * Generate next specification ID
   */
  generateNextSpecificationId(projectPath: string, type: SpecificationType): string {
    const config = this.getProjectConfig(projectPath);
    if (!config) {
      throw new Error('Project not initialized');
    }

    const counter = config.counters[type] + 1;
    config.counters[type] = counter;
    this.saveProjectConfig(projectPath, config);

    // Format: TYPE-00001
    const paddedNumber = counter.toString().padStart(5, '0');
    const typePrefix = this.getTypePrefix(type);
    return `${typePrefix}-${paddedNumber}`;
  }

  /**
   * Get short prefix for specification type
   */
  private getTypePrefix(type: SpecificationType): string {
    switch (type) {
      case SpecificationType.USER_STORY:
        return 'US';
      case SpecificationType.FUNCTIONAL:
        return 'FR';
      case SpecificationType.SUCCESS_CRITERIA:
        return 'SC';
      case SpecificationType.NON_FUNCTIONAL:
        return 'NFR';
      default:
        return 'SPEC';
    }
  }

  /**
   * Read markdown file content
   */
  readMarkdownFile(projectPath: string, fileName: 'plan' | 'tasks' | 'implement'): string {
    const paths = this.getSpecKitPaths(projectPath);
    const filePath = paths[fileName];

    if (!fs.existsSync(filePath)) {
      return '';
    }

    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Write markdown file content
   */
  writeMarkdownFile(
    projectPath: string,
    fileName: 'plan' | 'tasks' | 'implement',
    content: string
  ): void {
    const paths = this.getSpecKitPaths(projectPath);
    const filePath = paths[fileName];

    fs.writeFileSync(filePath, content);

    // Update lastSync in config
    const config = this.getProjectConfig(projectPath);
    if (config) {
      config.lastSync = new Date().toISOString();
      this.saveProjectConfig(projectPath, config);
    }
  }

  /**
   * Check if all required speckit files exist
   */
  validateProject(projectPath: string): { valid: boolean; missing: string[] } {
    const paths = this.getSpecKitPaths(projectPath);
    const missing: string[] = [];

    Object.entries(paths).forEach(([name, filePath]) => {
      if (!fs.existsSync(filePath)) {
        missing.push(name);
      }
    });

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get project info
   */
  getProject(projectPath: string): Project | null {
    if (!fs.existsSync(projectPath)) {
      return null;
    }

    const config = this.getProjectConfig(projectPath);
    if (!config) {
      return null;
    }

    const stats = fs.statSync(projectPath);

    return {
      path: projectPath,
      name: path.basename(projectPath),
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
    };
  }
}
