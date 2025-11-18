import axios from 'axios';
import {
  Specification,
  AnalysisResponse,
  Project,
  InputType,
  TokenUsage
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

class ApiService {
  // ============================================================================
  // PROJECTS
  // ============================================================================

  async initializeProject(projectPath: string, projectName?: string): Promise<Project> {
    const response = await axios.post(`${API_URL}/projects/init`, {
      projectPath,
      projectName
    });
    return response.data;
  }

  async getProjectInfo(projectPath: string): Promise<Project & { validation: any; config: any }> {
    const response = await axios.post(`${API_URL}/projects/info`, {
      projectPath
    });
    return response.data;
  }

  async validateProject(projectPath: string): Promise<{ valid: boolean; missing: string[] }> {
    const response = await axios.post(`${API_URL}/projects/validate`, {
      projectPath
    });
    return response.data;
  }

  // ============================================================================
  // SPECIFICATIONS
  // ============================================================================

  async getAllSpecifications(projectPath: string): Promise<Specification[]> {
    const response = await axios.post(`${API_URL}/specifications/all`, {
      projectPath
    });
    return response.data;
  }

  async addSpecification(projectPath: string, specification: Specification): Promise<Specification> {
    const response = await axios.post(`${API_URL}/specifications/add`, {
      projectPath,
      specification
    });
    return response.data;
  }

  async generateSpecificationId(projectPath: string, type: string): Promise<{ id: string; type: string }> {
    const response = await axios.post(`${API_URL}/specifications/generate-id`, {
      projectPath,
      type
    });
    return response.data;
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  async analyzeText(
    text: string,
    projectPath: string,
    inputType: InputType,
    promptId?: string
  ): Promise<AnalysisResponse> {
    const response = await axios.post(`${API_URL}/analyze`, {
      text,
      projectPath,
      inputType,
      promptId
    });
    return response.data;
  }

  // ============================================================================
  // MARKDOWN FILES
  // ============================================================================

  async readMarkdownFile(
    projectPath: string,
    fileName: 'plan' | 'tasks' | 'implement'
  ): Promise<{ fileName: string; content: string }> {
    const response = await axios.post(`${API_URL}/markdown/read`, {
      projectPath,
      fileName
    });
    return response.data;
  }

  async writeMarkdownFile(
    projectPath: string,
    fileName: 'plan' | 'tasks' | 'implement',
    content: string
  ): Promise<{ success: boolean; fileName: string }> {
    const response = await axios.post(`${API_URL}/markdown/write`, {
      projectPath,
      fileName,
      content
    });
    return response.data;
  }

  // ============================================================================
  // PROMPTS
  // ============================================================================

  async getPrompts(category?: string): Promise<any[]> {
    const url = category ? `${API_URL}/prompts?category=${category}` : `${API_URL}/prompts`;
    const response = await axios.get(url);
    return response.data;
  }

  async getPrompt(promptId: string): Promise<any> {
    const response = await axios.get(`${API_URL}/prompts/${promptId}`);
    return response.data;
  }

  // ============================================================================
  // TOKEN USAGE
  // ============================================================================

  async getTokenUsageEntries(
    projectPath: string,
    limit?: number,
    offset?: number
  ): Promise<{ entries: any[]; totalCount: number; limit?: number; offset?: number }> {
    const response = await axios.post(`${API_URL}/token-usage/entries`, {
      projectPath,
      limit,
      offset
    });
    return response.data;
  }

  async getTokenUsageStats(projectPath: string): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  }> {
    const response = await axios.post(`${API_URL}/token-usage/stats`, {
      projectPath
    });
    return response.data;
  }
}

export default new ApiService();
