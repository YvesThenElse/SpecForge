import { Router, Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { FileService } from '../services/FileService';
import { LLMService } from '../services/LLMService';
import { PromptService } from '../services/PromptService';
import { TokenTrackingService } from '../services/TokenTrackingService';
import { AnalysisRequest, InputType } from '../types';

export function createRouter(fileService: FileService, llmService: LLMService, io: SocketIOServer) {
  const router = Router();
  const promptService = new PromptService();
  const tokenTracker = new TokenTrackingService();

  // Health check
  router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============================================================================
  // PROJECTS
  // ============================================================================

  // Initialize a new project (select directory and create speckit files)
  router.post('/projects/init', async (req: Request, res: Response) => {
    try {
      const { projectPath, projectName } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      console.log(`Initializing project at: ${projectPath}`);

      // Check if already initialized
      if (fileService.isProjectInitialized(projectPath)) {
        return res.status(400).json({ error: 'Project already initialized' });
      }

      // Initialize project with templates
      const project = await fileService.initializeProject(projectPath, projectName);

      console.log(`✅ Project initialized: ${project.name}`);
      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error initializing project:', error);
      res.status(500).json({
        error: 'Failed to initialize project',
        message: error.message
      });
    }
  });

  // Get project info
  router.post('/projects/info', (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      const project = fileService.getProject(projectPath);

      if (!project) {
        return res.status(404).json({ error: 'Project not found or not initialized' });
      }

      // Get project validation status
      const validation = fileService.validateProject(projectPath);
      const config = fileService.getProjectConfig(projectPath);

      res.json({
        ...project,
        validation,
        config
      });
    } catch (error: any) {
      console.error('Error getting project info:', error);
      res.status(500).json({ error: 'Failed to get project info' });
    }
  });

  // Validate project structure
  router.post('/projects/validate', (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      const validation = fileService.validateProject(projectPath);
      res.json(validation);
    } catch (error: any) {
      console.error('Error validating project:', error);
      res.status(500).json({ error: 'Failed to validate project' });
    }
  });

  // ============================================================================
  // SPECIFICATIONS
  // ============================================================================

  // Get all specifications for a project
  router.post('/specifications/all', (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      const specifications = fileService.getAllSpecifications(projectPath);
      res.json(specifications);
    } catch (error: any) {
      console.error('Error getting specifications:', error);
      res.status(500).json({ error: 'Failed to get specifications' });
    }
  });

  // Add a specification
  router.post('/specifications/add', (req: Request, res: Response) => {
    try {
      const { projectPath, specification } = req.body;

      if (!projectPath || !specification) {
        return res.status(400).json({ error: 'Project path and specification are required' });
      }

      if (!specification.id || !specification.type || !specification.title) {
        return res.status(400).json({ error: 'Invalid specification data' });
      }

      fileService.addSpecification(projectPath, specification);

      // Broadcast to clients watching this project
      const config = fileService.getProjectConfig(projectPath);
      if (config) {
        io.to(`project:${config.projectId}`).emit('specification:created', specification);
      }

      console.log(`✅ Specification added: ${specification.id} - ${specification.type}`);
      res.status(201).json(specification);
    } catch (error: any) {
      console.error('Error adding specification:', error);
      res.status(500).json({ error: 'Failed to add specification' });
    }
  });

  // Generate next specification ID
  router.post('/specifications/generate-id', (req: Request, res: Response) => {
    try {
      const { projectPath, type } = req.body;

      if (!projectPath || !type) {
        return res.status(400).json({ error: 'Project path and type are required' });
      }

      const id = fileService.generateNextSpecificationId(projectPath, type);
      res.json({ id, type });
    } catch (error: any) {
      console.error('Error generating specification ID:', error);
      res.status(500).json({ error: 'Failed to generate specification ID' });
    }
  });

  // ============================================================================
  // MARKDOWN FILES (plan, tasks, implement)
  // ============================================================================

  // Read a markdown file
  router.post('/markdown/read', (req: Request, res: Response) => {
    try {
      const { projectPath, fileName } = req.body;

      if (!projectPath || !fileName) {
        return res.status(400).json({ error: 'Project path and file name are required' });
      }

      if (!['plan', 'tasks', 'implement'].includes(fileName)) {
        return res.status(400).json({ error: 'Invalid file name. Must be: plan, tasks, or implement' });
      }

      const content = fileService.readMarkdownFile(projectPath, fileName as 'plan' | 'tasks' | 'implement');
      res.json({ fileName, content });
    } catch (error: any) {
      console.error('Error reading markdown file:', error);
      res.status(500).json({ error: 'Failed to read markdown file' });
    }
  });

  // Write a markdown file
  router.post('/markdown/write', (req: Request, res: Response) => {
    try {
      const { projectPath, fileName, content } = req.body;

      if (!projectPath || !fileName || content === undefined) {
        return res.status(400).json({ error: 'Project path, file name, and content are required' });
      }

      if (!['plan', 'tasks', 'implement'].includes(fileName)) {
        return res.status(400).json({ error: 'Invalid file name. Must be: plan, tasks, or implement' });
      }

      fileService.writeMarkdownFile(projectPath, fileName as 'plan' | 'tasks' | 'implement', content);

      // Broadcast update
      const config = fileService.getProjectConfig(projectPath);
      if (config) {
        io.to(`project:${config.projectId}`).emit('markdown:updated', { fileName, content });
      }

      console.log(`✅ Markdown file updated: ${fileName}`);
      res.json({ success: true, fileName });
    } catch (error: any) {
      console.error('Error writing markdown file:', error);
      res.status(500).json({ error: 'Failed to write markdown file' });
    }
  });

  // ============================================================================
  // LLM ANALYSIS
  // ============================================================================

  // Analyze text and extract specifications
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { text, projectPath, inputType, promptId }: AnalysisRequest = req.body;

      if (!text || !projectPath || !inputType) {
        return res.status(400).json({
          error: 'Text, projectPath, and inputType are required for analysis'
        });
      }

      console.log(`Analyzing text (${text.length} characters) for type: ${inputType}...`);

      // Analyze text
      const specifications = await llmService.analyzeText(text, projectPath, inputType, promptId);
      const tokenUsage = llmService.getLastTokenUsage();

      console.log(`✅ Extracted ${specifications.length} specifications`);

      // Log specification types breakdown
      const typeBreakdown = specifications.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`📊 Specification types:`, typeBreakdown);

      // Get existing specifications for duplicate check
      const existingSpecs = fileService.getAllSpecifications(projectPath);

      let savedCount = 0;
      let duplicateCount = 0;

      for (const specification of specifications) {
        // Check for duplicates
        const similarSpecs = llmService.findSimilarSpecifications(
          specification,
          existingSpecs,
          0.8 // 80% similarity threshold
        );

        if (similarSpecs.length > 0) {
          console.log(`⚠️  Similar specification found: ${specification.type} - "${specification.title}"`);
          duplicateCount++;
          continue;
        }

        // Save the specification
        fileService.addSpecification(projectPath, specification);

        // Broadcast to all clients
        const config = fileService.getProjectConfig(projectPath);
        if (config) {
          io.to(`project:${config.projectId}`).emit('specification:created', specification);
        }

        console.log(`✅ Saved: ${specification.id} - ${specification.type} - "${specification.title}"`);
        savedCount++;
      }

      console.log(`📊 Summary: ${savedCount} saved, ${duplicateCount} duplicates skipped`);

      const summary = await llmService.generateSummary(specifications);

      res.json({
        specifications,
        summary,
        tokenUsage,
        stats: {
          saved: savedCount,
          duplicates: duplicateCount,
          total: specifications.length
        }
      });
    } catch (error: any) {
      console.error('Error analyzing text:', error);
      res.status(500).json({
        error: 'Failed to analyze text',
        message: error.message
      });
    }
  });

  // ============================================================================
  // PROMPTS MANAGEMENT (kept for compatibility)
  // ============================================================================

  // Get all prompts
  router.get('/prompts', (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const prompts = promptService.getAllPrompts(category as string);
      res.json(prompts);
    } catch (error: any) {
      console.error('Error getting prompts:', error);
      res.status(500).json({ error: 'Failed to get prompts' });
    }
  });

  // Get a specific prompt
  router.get('/prompts/:promptId', (req: Request, res: Response) => {
    try {
      const { promptId } = req.params;
      const prompt = promptService.getPrompt(promptId);

      if (!prompt) {
        return res.status(404).json({ error: 'Prompt not found' });
      }

      res.json(prompt);
    } catch (error: any) {
      console.error('Error getting prompt:', error);
      res.status(500).json({ error: 'Failed to get prompt' });
    }
  });

  // ============================================================================
  // TOKEN USAGE TRACKING
  // ============================================================================

  // Get token usage entries for a project
  router.post('/token-usage/entries', (req: Request, res: Response) => {
    try {
      const { projectPath, limit, offset } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      const config = fileService.getProjectConfig(projectPath);
      if (!config) {
        return res.status(404).json({ error: 'Project not initialized' });
      }

      const entries = tokenTracker.getAllEntries(
        config.projectId,
        limit,
        offset
      );
      const totalCount = tokenTracker.getCount(config.projectId);

      res.json({
        entries,
        totalCount,
        limit,
        offset
      });
    } catch (error: any) {
      console.error('Error getting token usage:', error);
      res.status(500).json({ error: 'Failed to get token usage' });
    }
  });

  // Get token usage statistics
  router.post('/token-usage/stats', (req: Request, res: Response) => {
    try {
      const { projectPath } = req.body;

      if (!projectPath) {
        return res.status(400).json({ error: 'Project path is required' });
      }

      const config = fileService.getProjectConfig(projectPath);
      if (!config) {
        return res.status(404).json({ error: 'Project not initialized' });
      }

      const stats = tokenTracker.getStats(config.projectId);
      res.json(stats);
    } catch (error: any) {
      console.error('Error getting token usage stats:', error);
      res.status(500).json({ error: 'Failed to get token usage stats' });
    }
  });

  return router;
}
