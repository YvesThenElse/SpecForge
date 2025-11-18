import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { Requirement } from '../types';
import { PromptService } from './PromptService';

// Architecture extraction interfaces (from prompt)
interface ArchitecturePerson {
  id: string;
  name: string;
  role: string;
  description: string;
  interactions: string[];
}

interface ArchitectureExternalSystem {
  id: string;
  name: string;
  type: string;
  description: string;
  protocol?: string;
  dataFormat?: string;
}

interface ArchitectureContainer {
  id: string;
  name: string;
  type: string;
  technology: string;
  description: string;
  responsibilities: string[];
  exposes?: {
    protocol?: string;
    port?: number;
    format?: string;
  };
  stores?: string[];
  dependencies?: string[];
  nonFunctional?: {
    latency?: string;
    availability?: string;
    security?: string;
  };
}

interface ArchitectureComponent {
  id: string;
  name: string;
  type: string;
  technology: string;
  description: string;
  capabilities: string[];
  dependencies: string[];
}

interface ArchitectureRelationship {
  from: string;
  to: string;
  label: string;
  protocol?: string;
  dataFlow?: string;
  async?: boolean;
  pattern?: string;
}

interface ExtractedArchitecture {
  level1_context: {
    system: {
      name: string;
      description: string;
      scope: string;
    };
    people: ArchitecturePerson[];
    external_systems: ArchitectureExternalSystem[];
    relationships: ArchitectureRelationship[];
  };
  level2_containers: ArchitectureContainer[];
  level2_relationships: ArchitectureRelationship[];
  level3_components: { [containerId: string]: ArchitectureComponent[] };
  level3_relationships: { [containerId: string]: ArchitectureRelationship[] };
}

// C4 Diagram interfaces
interface C4Element {
  id: string;
  type: 'person' | 'system' | 'container' | 'component';
  name: string;
  description: string;
  technology?: string;
  requirements: string[];
  children?: string[]; // IDs of child elements (for navigation)
}

interface C4Relationship {
  from: string;
  to: string;
  label: string;
  technology?: string;
}

interface C4Diagram {
  id: string;
  level: 1 | 2 | 3;
  type: 'context' | 'container' | 'component';
  title: string;
  description: string;
  mermaidCode: string;
  elements: C4Element[];
  relationships: C4Relationship[];
  requirementReferences: string[];
  generatedAt: string;
  parentId?: string; // Parent element ID for navigation
}

export class C4Service {
  private openai: OpenAI;
  private projectsDir: string;
  private promptService: PromptService;

  constructor(apiKey: string, projectsDir: string) {
    this.openai = new OpenAI({ apiKey });
    this.projectsDir = projectsDir;
    this.promptService = new PromptService();
  }

  /**
   * Extract architectural elements from requirements using the Architecture prompt
   */
  private async extractArchitecture(requirements: Requirement[]): Promise<ExtractedArchitecture> {
    // Combine all requirements into a single text
    const text = requirements.map(r =>
      `[${r.type}] ${r.title}\n${r.description}\n${r.rationale || ''}`
    ).join('\n\n');

    // Get the Architecture prompt
    const promptTemplate = this.promptService.getPromptContent('architecture-c4-extraction');
    if (!promptTemplate) {
      throw new Error('Architecture prompt not found');
    }

    const prompt = promptTemplate.replace(/\{\{TEXT\}\}/g, text);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a software architect expert in C4 modeling. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const content = response.choices[0]?.message?.content || '{}';
      let jsonContent = content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/g, '');
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error extracting architecture:', error);
      // Return minimal fallback structure
      return this.getFallbackArchitecture(requirements);
    }
  }

  async generateC4Diagrams(projectId: string, requirements: Requirement[]): Promise<C4Diagram[]> {
    console.log(`Generating C4 diagrams for project ${projectId} with ${requirements.length} requirements...`);

    // Extract architecture using AI
    const architecture = await this.extractArchitecture(requirements);

    const diagrams: C4Diagram[] = [];

    // Level 1: System Context
    const level1 = this.buildLevel1Diagram(architecture, requirements);
    diagrams.push(level1);

    // Level 2: Containers (one per main system or significant container group)
    const level2Diagrams = this.buildLevel2Diagrams(architecture, requirements);
    diagrams.push(...level2Diagrams);

    // Level 3: Components (one per container)
    const level3Diagrams = this.buildLevel3Diagrams(architecture, requirements);
    diagrams.push(...level3Diagrams);

    // Save diagrams
    this.saveDiagrams(projectId, diagrams);

    console.log(`✅ Generated ${diagrams.length} C4 diagrams`);

    return diagrams;
  }

  private buildLevel1Diagram(arch: ExtractedArchitecture, requirements: Requirement[]): C4Diagram {
    const elements: C4Element[] = [];

    // Main system
    const systemId = 'main-system';
    elements.push({
      id: systemId,
      type: 'system',
      name: arch.level1_context.system.name,
      description: arch.level1_context.system.description,
      requirements: requirements.map(r => r.id),
      children: arch.level2_containers.map(c => c.id) // Link to containers
    });

    // People
    arch.level1_context.people.forEach(person => {
      elements.push({
        id: person.id,
        type: 'person',
        name: person.name,
        description: `${person.role}: ${person.description}`,
        requirements: []
      });
    });

    // External systems
    arch.level1_context.external_systems.forEach(sys => {
      elements.push({
        id: sys.id,
        type: 'system',
        name: sys.name,
        description: sys.description,
        technology: sys.protocol,
        requirements: []
      });
    });

    // Relationships
    const relationships: C4Relationship[] = arch.level1_context.relationships.map(rel => ({
      from: rel.from,
      to: rel.to === 'system' ? systemId : rel.to,
      label: rel.label,
      technology: rel.protocol
    }));

    const mermaidCode = this.generateMermaidLevel1(elements, relationships);

    return {
      id: 'level1-context',
      level: 1,
      type: 'context',
      title: 'System Context Diagram',
      description: arch.level1_context.system.scope,
      mermaidCode,
      elements,
      relationships,
      requirementReferences: requirements.map(r => r.id),
      generatedAt: new Date().toISOString()
    };
  }

  private buildLevel2Diagrams(arch: ExtractedArchitecture, requirements: Requirement[]): C4Diagram[] {
    // Create one main Level 2 diagram showing all containers
    const elements: C4Element[] = arch.level2_containers.map(container => ({
      id: container.id,
      type: 'container',
      name: container.name,
      description: container.description,
      technology: container.technology,
      requirements: requirements
        .filter(r => container.responsibilities.some(resp =>
          r.title.toLowerCase().includes(resp.toLowerCase()) ||
          r.description.toLowerCase().includes(resp.toLowerCase())
        ))
        .map(r => r.id),
      children: arch.level3_components[container.id]?.map(c => c.id) || []
    }));

    // Add external systems referenced
    arch.level1_context.external_systems.forEach(sys => {
      if (arch.level2_relationships.some(r => r.from === sys.id || r.to === sys.id)) {
        elements.push({
          id: sys.id,
          type: 'system',
          name: sys.name,
          description: sys.description,
          technology: sys.protocol,
          requirements: []
        });
      }
    });

    const relationships: C4Relationship[] = arch.level2_relationships.map(rel => ({
      from: rel.from,
      to: rel.to,
      label: rel.label,
      technology: rel.protocol || rel.dataFlow
    }));

    const mermaidCode = this.generateMermaidLevel2(elements, relationships);

    return [{
      id: 'level2-containers',
      level: 2,
      type: 'container',
      title: 'Container Diagram',
      description: 'Deployable units and their interactions',
      mermaidCode,
      elements,
      relationships,
      requirementReferences: requirements.map(r => r.id),
      generatedAt: new Date().toISOString(),
      parentId: 'main-system'
    }];
  }

  private buildLevel3Diagrams(arch: ExtractedArchitecture, requirements: Requirement[]): C4Diagram[] {
    const diagrams: C4Diagram[] = [];

    // Create one Level 3 diagram per container that has components
    Object.keys(arch.level3_components).forEach(containerId => {
      const components = arch.level3_components[containerId];
      if (!components || components.length === 0) return;

      const container = arch.level2_containers.find(c => c.id === containerId);
      if (!container) return;

      const elements: C4Element[] = components.map(comp => ({
        id: comp.id,
        type: 'component',
        name: comp.name,
        description: comp.description,
        technology: comp.technology,
        requirements: requirements
          .filter(r => comp.capabilities.some(cap =>
            r.title.toLowerCase().includes(cap.toLowerCase()) ||
            r.description.toLowerCase().includes(cap.toLowerCase())
          ))
          .map(r => r.id)
      }));

      const relationships: C4Relationship[] = (arch.level3_relationships[containerId] || []).map(rel => ({
        from: rel.from,
        to: rel.to,
        label: rel.label,
        technology: rel.pattern
      }));

      const mermaidCode = this.generateMermaidLevel3(container.name, elements, relationships);

      diagrams.push({
        id: `level3-${containerId}`,
        level: 3,
        type: 'component',
        title: `Component Diagram - ${container.name}`,
        description: `Internal components of ${container.name}`,
        mermaidCode,
        elements,
        relationships,
        requirementReferences: requirements
          .filter(r => elements.some(e => e.requirements.includes(r.id)))
          .map(r => r.id),
        generatedAt: new Date().toISOString(),
        parentId: containerId
      });
    });

    return diagrams;
  }

  private generateMermaidLevel1(elements: C4Element[], relationships: C4Relationship[]): string {
    let mermaid = 'C4Context\n';
    mermaid += '  title System Context Diagram\n\n';

    // Main system
    const mainSystem = elements.find(e => e.type === 'system' && e.id === 'main-system');
    if (mainSystem) {
      mermaid += `  System(${mainSystem.id}, "${mainSystem.name}", "${mainSystem.description}")\n\n`;
    }

    // People
    elements.filter(e => e.type === 'person').forEach(el => {
      mermaid += `  Person(${el.id}, "${el.name}", "${el.description}")\n`;
    });

    // External systems
    elements.filter(e => e.type === 'system' && e.id !== 'main-system').forEach(el => {
      const tech = el.technology ? `, "${el.technology}"` : '';
      mermaid += `  System_Ext(${el.id}, "${el.name}", "${el.description}"${tech})\n`;
    });

    mermaid += '\n';

    // Relationships
    relationships.forEach(rel => {
      const tech = rel.technology ? `, "${rel.technology}"` : '';
      mermaid += `  Rel(${rel.from}, ${rel.to}, "${rel.label}"${tech})\n`;
    });

    return mermaid;
  }

  private generateMermaidLevel2(elements: C4Element[], relationships: C4Relationship[]): string {
    let mermaid = 'C4Container\n';
    mermaid += '  title Container Diagram\n\n';
    mermaid += '  System_Boundary(system, "System") {\n';

    // Containers
    elements.filter(e => e.type === 'container').forEach(el => {
      const tech = el.technology || 'Technology';
      mermaid += `    Container(${el.id}, "${el.name}", "${tech}", "${el.description}")\n`;
    });

    mermaid += '  }\n\n';

    // External systems
    elements.filter(e => e.type === 'system').forEach(el => {
      const tech = el.technology ? `, "${el.technology}"` : '';
      mermaid += `  System_Ext(${el.id}, "${el.name}", "${el.description}"${tech})\n`;
    });

    mermaid += '\n';

    // Relationships
    relationships.forEach(rel => {
      const tech = rel.technology ? `, "${rel.technology}"` : '';
      mermaid += `  Rel(${rel.from}, ${rel.to}, "${rel.label}"${tech})\n`;
    });

    return mermaid;
  }

  private generateMermaidLevel3(containerName: string, elements: C4Element[], relationships: C4Relationship[]): string {
    let mermaid = 'C4Component\n';
    mermaid += `  title Component Diagram - ${containerName}\n\n`;
    mermaid += `  Container_Boundary(container, "${containerName}") {\n`;

    // Components
    elements.forEach(el => {
      const tech = el.technology || 'Component';
      mermaid += `    Component(${el.id}, "${el.name}", "${tech}", "${el.description}")\n`;
    });

    mermaid += '  }\n\n';

    // Relationships
    relationships.forEach(rel => {
      const tech = rel.technology ? `, "${rel.technology}"` : '';
      mermaid += `  Rel(${rel.from}, ${rel.to}, "${rel.label}"${tech})\n`;
    });

    return mermaid;
  }

  private getFallbackArchitecture(requirements: Requirement[]): ExtractedArchitecture {
    return {
      level1_context: {
        system: {
          name: 'System',
          description: 'Main system based on requirements',
          scope: 'To be defined'
        },
        people: [
          {
            id: 'user',
            name: 'User',
            role: 'End User',
            description: 'Interacts with the system',
            interactions: ['use system']
          }
        ],
        external_systems: [],
        relationships: [
          {
            from: 'user',
            to: 'system',
            label: 'Uses',
            protocol: 'HTTPS'
          }
        ]
      },
      level2_containers: [
        {
          id: 'webapp',
          name: 'Web Application',
          type: 'WebApp',
          technology: 'Web Browser',
          description: 'User interface',
          responsibilities: ['Display UI', 'Handle user input'],
          dependencies: ['api']
        },
        {
          id: 'api',
          name: 'API',
          type: 'API',
          technology: 'REST API',
          description: 'Backend API',
          responsibilities: ['Business logic', 'Data access'],
          dependencies: []
        }
      ],
      level2_relationships: [
        {
          from: 'webapp',
          to: 'api',
          label: 'Makes API calls',
          protocol: 'HTTPS'
        }
      ],
      level3_components: {},
      level3_relationships: {}
    };
  }

  private saveDiagrams(projectId: string, diagrams: C4Diagram[]): void {
    const c4Dir = path.join(this.projectsDir, projectId, 'c4-diagrams');
    if (!fs.existsSync(c4Dir)) {
      fs.mkdirSync(c4Dir, { recursive: true });
    }

    // Save each diagram individually
    diagrams.forEach(diagram => {
      const filename = `${diagram.id}.json`;
      fs.writeFileSync(
        path.join(c4Dir, filename),
        JSON.stringify(diagram, null, 2)
      );
    });

    // Save index file for easy retrieval
    const index = {
      diagrams: diagrams.map(d => ({
        id: d.id,
        level: d.level,
        type: d.type,
        title: d.title,
        parentId: d.parentId
      })),
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(c4Dir, 'index.json'),
      JSON.stringify(index, null, 2)
    );
  }

  async getDiagrams(projectId: string): Promise<C4Diagram[]> {
    const c4Dir = path.join(this.projectsDir, projectId, 'c4-diagrams');

    if (!fs.existsSync(c4Dir)) {
      return [];
    }

    const indexPath = path.join(c4Dir, 'index.json');
    if (!fs.existsSync(indexPath)) {
      return [];
    }

    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const diagrams: C4Diagram[] = [];

    for (const diagramRef of index.diagrams) {
      const filePath = path.join(c4Dir, `${diagramRef.id}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        diagrams.push(JSON.parse(content));
      }
    }

    return diagrams;
  }
}
