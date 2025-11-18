import axios from 'axios';
import { Specification, Project } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';

class ApiService {
  // Project operations
  async getProjectInfo(projectPath: string): Promise<Project & { validation: any }> {
    const response = await axios.post(`${API_URL}/projects/info`, { projectPath });
    return response.data;
  }

  async initializeProject(projectPath: string, projectName?: string): Promise<Project> {
    const response = await axios.post(`${API_URL}/projects/init`, { projectPath, projectName });
    return response.data;
  }

  async validateProject(projectPath: string): Promise<any> {
    const response = await axios.post(`${API_URL}/projects/validate`, { projectPath });
    return response.data;
  }

  // Specification operations
  async getAllSpecifications(projectPath: string): Promise<Specification[]> {
    const response = await axios.post(`${API_URL}/specifications/all`, { projectPath });
    return response.data;
  }

  async addSpecification(projectPath: string, specification: Omit<Specification, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Specification> {
    const response = await axios.post(`${API_URL}/specifications/add`, { projectPath, specification });
    return response.data;
  }

  async generateSpecificationId(projectPath: string, type: string): Promise<{ id: string }> {
    const response = await axios.post(`${API_URL}/specifications/generate-id`, { projectPath, type });
    return response.data;
  }

  // Markdown file operations
  async readMarkdownFile(projectPath: string, fileName: 'plan' | 'tasks' | 'implement'): Promise<{ fileName: string; content: string }> {
    const response = await axios.post(`${API_URL}/markdown/read`, { projectPath, fileName });
    return response.data;
  }

  async writeMarkdownFile(projectPath: string, fileName: 'plan' | 'tasks' | 'implement', content: string): Promise<void> {
    await axios.post(`${API_URL}/markdown/write`, { projectPath, fileName, content });
  }

  // Prompts
  async getPrompts(): Promise<any[]> {
    const response = await axios.get(`${API_URL}/prompts`);
    return response.data;
  }

  async getPrompt(promptId: string): Promise<any> {
    const response = await axios.get(`${API_URL}/prompts/${promptId}`);
    return response.data;
  }

  // Token usage
  async getTokenUsageEntries(projectPath: string, limit?: number): Promise<any[]> {
    const response = await axios.post(`${API_URL}/token-usage/entries`, { projectPath, limit });
    return response.data;
  }

  async getTokenUsageStats(projectPath: string): Promise<any> {
    const response = await axios.post(`${API_URL}/token-usage/stats`, { projectPath });
    return response.data;
  }
}

export default new ApiService();
