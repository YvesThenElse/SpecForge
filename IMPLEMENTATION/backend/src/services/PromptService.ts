import * as fs from 'fs';
import * as path from 'path';

export interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  file: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lauraDisplayName?: string;  // Name displayed in LAURA
  icon?: string;               // Emoji icon
  lauraDescription?: string;   // Editable description in LAURA
}

export interface PromptCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface PromptVersion {
  version: number;
  content: string;
  timestamp: string;
  author?: string;
}

export interface PromptData {
  metadata: PromptMetadata;
  content: string;
  versions: PromptVersion[];
}

export interface RequirementTypeConfig {
  code: string;
  name: string;
  enabled: boolean;
  description: string;
  order: number;
}

export interface AnalysisPromptConfig {
  promptId: string;
  header: string;
  types: RequirementTypeConfig[];
  footer: string;
  outputFormat: string;
}

interface MetadataFile {
  prompts: PromptMetadata[];
  categories: PromptCategory[];
}

export class PromptService {
  private promptsDir: string;
  private metadataPath: string;
  private historyDir: string;
  private configsDir: string;

  constructor(promptsDir?: string) {
    // If no directory specified, use the prompts directory in the backend folder
    // __dirname is in dist/services, so we need to go up 2 levels to reach backend root
    if (!promptsDir) {
      promptsDir = path.resolve(__dirname, '../../prompts');
    }

    this.promptsDir = promptsDir;
    this.metadataPath = path.join(this.promptsDir, 'metadata.json');
    this.historyDir = path.join(this.promptsDir, 'history');
    this.configsDir = path.join(this.promptsDir, 'configs');

    console.log(`📝 PromptService initialized with directory: ${this.promptsDir}`);
    console.log(`📁 Checking if metadata.json exists at: ${this.metadataPath}`);
    console.log(`📁 Metadata exists: ${require('fs').existsSync(this.metadataPath)}`);
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.promptsDir)) {
      fs.mkdirSync(this.promptsDir, { recursive: true });
    }
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
    if (!fs.existsSync(this.configsDir)) {
      fs.mkdirSync(this.configsDir, { recursive: true });
    }
  }

  private loadMetadata(): MetadataFile {
    if (!fs.existsSync(this.metadataPath)) {
      console.warn(`⚠️  Metadata file not found at ${this.metadataPath}, creating default`);
      const defaultMetadata: MetadataFile = {
        prompts: [],
        categories: []
      };
      this.saveMetadata(defaultMetadata);
      return defaultMetadata;
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading metadata from ${this.metadataPath}:`, error);
      throw error;
    }
  }

  private saveMetadata(metadata: MetadataFile): void {
    fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get all prompt categories
   */
  getCategories(): PromptCategory[] {
    try {
      const metadata = this.loadMetadata();
      console.log(`📂 Loaded ${metadata.categories.length} categories`);
      return metadata.categories.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get all prompts, optionally filtered by category
   */
  getAllPrompts(category?: string): PromptMetadata[] {
    try {
      const metadata = this.loadMetadata();
      let prompts = metadata.prompts;

      if (category) {
        prompts = prompts.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      console.log(`📝 Loaded ${prompts.length} prompts${category ? ` (filtered by ${category})` : ''}`);
      return prompts;
    } catch (error) {
      console.error('❌ Error getting prompts:', error);
      throw error;
    }
  }

  /**
   * Get a specific prompt by ID with its content
   */
  getPrompt(promptId: string): PromptData | null {
    const metadata = this.loadMetadata();
    const promptMeta = metadata.prompts.find(p => p.id === promptId);

    if (!promptMeta) {
      return null;
    }

    const promptPath = path.join(this.promptsDir, promptMeta.file);

    if (!fs.existsSync(promptPath)) {
      console.error(`Prompt file not found: ${promptPath}`);
      return null;
    }

    const content = fs.readFileSync(promptPath, 'utf-8');
    const versions = this.getPromptVersions(promptId);

    return {
      metadata: promptMeta,
      content,
      versions
    };
  }

  /**
   * Get prompt content by ID (for LLMService)
   */
  getPromptContent(promptId: string): string | null {
    const promptData = this.getPrompt(promptId);
    return promptData ? promptData.content : null;
  }

  /**
   * Update a prompt's content and create a new version
   */
  updatePrompt(promptId: string, newContent: string, author?: string): PromptData {
    const metadata = this.loadMetadata();
    const promptMeta = metadata.prompts.find(p => p.id === promptId);

    if (!promptMeta) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const promptPath = path.join(this.promptsDir, promptMeta.file);

    // Read current content before updating
    const currentContent = fs.existsSync(promptPath)
      ? fs.readFileSync(promptPath, 'utf-8')
      : '';

    // Save current version to history
    const timestamp = new Date().toISOString();
    const historyFilename = `${promptId}_v${promptMeta.version}_${Date.now()}.txt`;
    const historyPath = path.join(this.historyDir, historyFilename);

    const versionData: PromptVersion = {
      version: promptMeta.version,
      content: currentContent,
      timestamp,
      author
    };

    fs.writeFileSync(historyPath, JSON.stringify(versionData, null, 2));

    // Update prompt file with new content
    fs.writeFileSync(promptPath, newContent);

    // Update metadata
    promptMeta.version += 1;
    promptMeta.updatedAt = timestamp;
    this.saveMetadata(metadata);

    // Return updated prompt data
    const versions = this.getPromptVersions(promptId);

    return {
      metadata: promptMeta,
      content: newContent,
      versions
    };
  }

  /**
   * Get all versions of a prompt
   */
  getPromptVersions(promptId: string): PromptVersion[] {
    const historyFiles = fs.readdirSync(this.historyDir);
    const promptHistoryFiles = historyFiles.filter(f =>
      f.startsWith(`${promptId}_v`) && f.endsWith('.txt')
    );

    const versions: PromptVersion[] = [];

    for (const file of promptHistoryFiles) {
      const filePath = path.join(this.historyDir, file);
      const versionData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      versions.push(versionData);
    }

    // Sort by version descending
    versions.sort((a, b) => b.version - a.version);

    return versions;
  }

  /**
   * Rollback to a specific version
   */
  rollbackToVersion(promptId: string, targetVersion: number, author?: string): PromptData {
    const versions = this.getPromptVersions(promptId);
    const targetVersionData = versions.find(v => v.version === targetVersion);

    if (!targetVersionData) {
      throw new Error(`Version ${targetVersion} not found for prompt ${promptId}`);
    }

    // Use updatePrompt to create a new version with the old content
    return this.updatePrompt(promptId, targetVersionData.content, author);
  }

  /**
   * Create a new prompt
   */
  createPrompt(
    id: string,
    name: string,
    description: string,
    category: string,
    content: string,
    filename?: string,
    lauraDisplayName?: string,
    icon?: string,
    lauraDescription?: string
  ): PromptData {
    const metadata = this.loadMetadata();

    // Check if prompt already exists
    if (metadata.prompts.some(p => p.id === id)) {
      throw new Error(`Prompt with ID ${id} already exists`);
    }

    // Generate filename if not provided
    const file = filename || `${category}/${id}.txt`;
    const promptPath = path.join(this.promptsDir, file);

    // Ensure directory exists
    const promptDir = path.dirname(promptPath);
    if (!fs.existsSync(promptDir)) {
      fs.mkdirSync(promptDir, { recursive: true });
    }

    // Create prompt file
    fs.writeFileSync(promptPath, content);

    // Create metadata entry
    const timestamp = new Date().toISOString();
    const promptMeta: PromptMetadata = {
      id,
      name,
      description,
      category,
      file,
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      lauraDisplayName,
      icon,
      lauraDescription
    };

    metadata.prompts.push(promptMeta);
    this.saveMetadata(metadata);

    return {
      metadata: promptMeta,
      content,
      versions: []
    };
  }

  /**
   * Update prompt metadata (name, description, Laura settings)
   */
  updatePromptMetadata(
    promptId: string,
    updates: {
      name?: string;
      description?: string;
      lauraDisplayName?: string;
      icon?: string;
      lauraDescription?: string;
    }
  ): PromptMetadata {
    const metadata = this.loadMetadata();
    const promptMeta = metadata.prompts.find(p => p.id === promptId);

    if (!promptMeta) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    // Update fields
    if (updates.name !== undefined) promptMeta.name = updates.name;
    if (updates.description !== undefined) promptMeta.description = updates.description;
    if (updates.lauraDisplayName !== undefined) promptMeta.lauraDisplayName = updates.lauraDisplayName;
    if (updates.icon !== undefined) promptMeta.icon = updates.icon;
    if (updates.lauraDescription !== undefined) promptMeta.lauraDescription = updates.lauraDescription;

    promptMeta.updatedAt = new Date().toISOString();
    this.saveMetadata(metadata);

    return promptMeta;
  }

  /**
   * Create a new Analysis prompt with default configuration
   */
  createAnalysisPrompt(
    id: string,
    name: string,
    description: string,
    lauraDisplayName: string,
    icon?: string,
    lauraDescription?: string
  ): PromptData {
    // Default configuration for new Analysis prompts
    const defaultConfig: AnalysisPromptConfig = {
      promptId: id,
      header: `You are analyzing the following input to extract structured requirements according to ISO/IEC/IEEE 29148 standard.

Please analyze the text and identify all requirements categorized by type.`,
      types: [
        { code: 'STK', name: 'Stakeholder', enabled: true, description: 'Identify all people, roles, or organizations mentioned', order: 1 },
        { code: 'BUS', name: 'Business', enabled: true, description: 'Extract business context, goals, and domain concepts', order: 2 },
        { code: 'USR', name: 'User', enabled: true, description: 'Identify user roles and their capabilities', order: 3 },
        { code: 'FUN', name: 'Functional', enabled: true, description: 'What the system must DO (actions, features, behaviors)', order: 4 },
        { code: 'PERF', name: 'Performance', enabled: true, description: 'Time constraints, speed requirements', order: 5 },
        { code: 'SEC', name: 'Security', enabled: true, description: 'Authentication, authorization, encryption, data protection', order: 6 },
        { code: 'USE', name: 'Usability', enabled: true, description: 'User experience, ease of use, accessibility', order: 7 },
        { code: 'REL', name: 'Reliability', enabled: true, description: 'Uptime, error handling, fault tolerance', order: 8 },
        { code: 'INT', name: 'Interface', enabled: true, description: 'APIs, external systems integrations, data exchange formats', order: 9 },
        { code: 'CON', name: 'Constraint', enabled: true, description: 'Limitations, restrictions, compliance needs', order: 10 },
        { code: 'SYS', name: 'System', enabled: false, description: 'System-level architecture and infrastructure', order: 11 },
        { code: 'NFR', name: 'Non-Functional', enabled: false, description: 'Other quality attributes', order: 12 },
        { code: 'MNT', name: 'Maintainability', enabled: false, description: 'Code quality, documentation, updates', order: 13 },
        { code: 'POR', name: 'Portability', enabled: false, description: 'Platform independence, migration needs', order: 14 },
        { code: 'LEG', name: 'Legal', enabled: false, description: 'Legal compliance, terms of service', order: 15 },
        { code: 'REG', name: 'Regulatory', enabled: false, description: 'Regulatory compliance (GDPR, HIPAA, etc.)', order: 16 },
        { code: 'VER', name: 'Verification', enabled: false, description: 'Testing and validation needs', order: 17 },
        { code: 'TRC', name: 'Traceability', enabled: false, description: 'Links to other requirements or documents', order: 18 }
      ],
      footer: `Important guidelines:
- Be comprehensive but avoid duplication
- Use clear, testable language
- Maintain traceability to source
- Flag ambiguities or missing information`,
      outputFormat: `Return ONLY a valid JSON array of requirements, with NO additional text, explanation, or markdown formatting.
Each requirement must have: { "type": "CODE", "text": "requirement description", "priority": "high|medium|low", "source": "reference to original text" }`
    };

    // Generate prompt content from config
    const content = this.generatePromptFromConfig(defaultConfig);

    // Create the prompt
    const promptData = this.createPrompt(
      id,
      name,
      description,
      'analysis',
      content,
      `analysis/${id}.txt`,
      lauraDisplayName,
      icon,
      lauraDescription
    );

    // Save the config
    const configPath = path.join(this.configsDir, `${id}.json`);
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));

    return promptData;
  }

  /**
   * Get the configuration for an Analysis prompt
   */
  getAnalysisConfig(promptId: string): AnalysisPromptConfig | null {
    const configPath = path.join(this.configsDir, `${promptId}.json`);

    if (!fs.existsSync(configPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Error loading config for ${promptId}:`, error);
      return null;
    }
  }

  /**
   * Save the configuration for an Analysis prompt and regenerate the .txt file
   */
  saveAnalysisConfig(config: AnalysisPromptConfig, author?: string): PromptData {
    const configPath = path.join(this.configsDir, `${config.promptId}.json`);

    // Save config JSON
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Generate the prompt text from config
    const generatedContent = this.generatePromptFromConfig(config);

    // Update the prompt file using the existing updatePrompt method
    return this.updatePrompt(config.promptId, generatedContent, author);
  }

  /**
   * Generate prompt text content from configuration
   */
  private generatePromptFromConfig(config: AnalysisPromptConfig): string {
    let promptText = config.header.trim() + '\n\n';

    // Add enabled types with their descriptions
    const enabledTypes = config.types.filter(t => t.enabled).sort((a, b) => a.order - b.order);

    enabledTypes.forEach((type, index) => {
      promptText += `${index + 1}. **${type.code} (${type.name})**: ${type.description}\n`;
    });

    promptText += '\n' + config.footer.trim() + '\n\n';
    promptText += config.outputFormat.trim() + '\n';

    return promptText;
  }

  /**
   * Parse an existing Analysis prompt into a configuration
   */
  parseAnalysisPrompt(promptId: string, content: string): AnalysisPromptConfig {
    // Default types configuration
    const defaultTypes: RequirementTypeConfig[] = [
      { code: 'STK', name: 'Stakeholder', enabled: true, description: 'Identify all people, roles, or organizations mentioned', order: 1 },
      { code: 'BUS', name: 'Business', enabled: true, description: 'Extract business context, goals, and domain concepts', order: 2 },
      { code: 'USR', name: 'User', enabled: true, description: 'Identify user roles and their capabilities', order: 3 },
      { code: 'FUN', name: 'Functional', enabled: true, description: 'What the system must DO (actions, features, behaviors)', order: 4 },
      { code: 'PERF', name: 'Performance', enabled: true, description: 'Time constraints, speed requirements', order: 5 },
      { code: 'SEC', name: 'Security', enabled: true, description: 'Authentication, authorization, encryption, data protection', order: 6 },
      { code: 'USE', name: 'Usability', enabled: true, description: 'User experience, ease of use, accessibility', order: 7 },
      { code: 'REL', name: 'Reliability', enabled: true, description: 'Uptime, error handling, fault tolerance', order: 8 },
      { code: 'INT', name: 'Interface', enabled: true, description: 'APIs, external systems integrations, data exchange formats', order: 9 },
      { code: 'CON', name: 'Constraint', enabled: true, description: 'Limitations, restrictions, compliance needs', order: 10 },
      { code: 'SYS', name: 'System', enabled: true, description: 'System-level architecture and infrastructure', order: 11 },
      { code: 'NFR', name: 'Non-Functional', enabled: true, description: 'Other quality attributes', order: 12 },
      { code: 'MNT', name: 'Maintainability', enabled: true, description: 'Code quality, documentation, updates', order: 13 },
      { code: 'POR', name: 'Portability', enabled: true, description: 'Platform independence, migration needs', order: 14 },
      { code: 'LEG', name: 'Legal', enabled: true, description: 'Legal compliance, terms of service', order: 15 },
      { code: 'REG', name: 'Regulatory', enabled: true, description: 'Regulatory compliance (GDPR, HIPAA, etc.)', order: 16 },
      { code: 'VER', name: 'Verification', enabled: true, description: 'Testing and validation needs', order: 17 },
      { code: 'TRC', name: 'Traceability', enabled: true, description: 'Links to other requirements or documents', order: 18 }
    ];

    // Try to parse the existing content
    // Simple parser: split by numbered list items (1., 2., etc.)
    const lines = content.split('\n');
    let header = '';
    let footer = '';
    let outputFormat = '';
    let inTypesList = false;
    let inFooter = false;
    let inOutput = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect start of numbered list
      if (/^\d+\.\s+\*\*[A-Z]+\s+\([^)]+\)\*\*:/.test(line)) {
        inTypesList = true;
        inFooter = false;

        // Extract type info from the line
        const match = line.match(/^\d+\.\s+\*\*([A-Z]+)\s+\(([^)]+)\)\*\*:\s*(.+)$/);
        if (match) {
          const [, code, name, description] = match;
          const typeIndex = defaultTypes.findIndex(t => t.code === code);
          if (typeIndex !== -1) {
            defaultTypes[typeIndex].description = description.trim();
          }
        }
      } else if (inTypesList && line.trim() === '') {
        // Empty line after types list marks start of footer
        inTypesList = false;
        inFooter = true;
      } else if (line.includes('Return ONLY') || line.includes('JSON array')) {
        inFooter = false;
        inOutput = true;
        outputFormat += line + '\n';
      } else if (inOutput) {
        outputFormat += line + '\n';
      } else if (inFooter) {
        footer += line + '\n';
      } else if (!inTypesList) {
        header += line + '\n';
      }
    }

    return {
      promptId,
      header: header.trim(),
      types: defaultTypes,
      footer: footer.trim(),
      outputFormat: outputFormat.trim()
    };
  }

  /**
   * Delete a prompt
   */
  deletePrompt(promptId: string): boolean {
    const metadata = this.loadMetadata();
    const promptIndex = metadata.prompts.findIndex(p => p.id === promptId);

    if (promptIndex === -1) {
      return false;
    }

    const promptMeta = metadata.prompts[promptIndex];
    const promptPath = path.join(this.promptsDir, promptMeta.file);

    // Delete prompt file
    if (fs.existsSync(promptPath)) {
      fs.unlinkSync(promptPath);
    }

    // Delete history files
    const historyFiles = fs.readdirSync(this.historyDir);
    const promptHistoryFiles = historyFiles.filter(f =>
      f.startsWith(`${promptId}_v`)
    );

    for (const file of promptHistoryFiles) {
      fs.unlinkSync(path.join(this.historyDir, file));
    }

    // Remove from metadata
    metadata.prompts.splice(promptIndex, 1);
    this.saveMetadata(metadata);

    return true;
  }
}
