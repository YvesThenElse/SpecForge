import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface TokenUsageEntry {
  id: string;
  projectId: string;
  timestamp: string;
  type: 'analysis' | 'c4-generation' | 'summary' | 'wireframe' | 'veille-techno' | 'other';
  operation: string; // Description of the operation
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  estimatedCost: number;
  metadata?: Record<string, any>; // Additional context (requirement IDs, etc.)
}

export interface TokenUsageStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  totalRequests: number;
  byType: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  byModel: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
}

export class TokenTrackingService {
  private trackingDir: string;

  constructor(trackingDir?: string) {
    if (!trackingDir) {
      // Store in projects directory
      trackingDir = path.resolve(__dirname, '../../projects');
    }
    this.trackingDir = trackingDir;
  }

  private getProjectTokenFile(projectId: string): string {
    const projectPath = path.join(this.trackingDir, projectId);
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    return path.join(projectPath, 'token-usage.jsonl');
  }

  /**
   * Log a token usage entry
   */
  logUsage(
    projectId: string,
    type: TokenUsageEntry['type'],
    operation: string,
    inputTokens: number,
    outputTokens: number,
    model: string,
    estimatedCost: number,
    metadata?: Record<string, any>
  ): TokenUsageEntry {
    const entry: TokenUsageEntry = {
      id: uuidv4(),
      projectId,
      timestamp: new Date().toISOString(),
      type,
      operation,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      model,
      estimatedCost,
      metadata
    };

    const filePath = this.getProjectTokenFile(projectId);

    // Append to JSONL file (one JSON object per line)
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(filePath, line, 'utf-8');

    console.log(`📊 Token usage logged: ${type} - ${operation} (${entry.totalTokens} tokens, $${estimatedCost.toFixed(4)})`);

    return entry;
  }

  /**
   * Get all token usage entries for a project
   */
  getAllEntries(projectId: string, limit?: number, offset?: number): TokenUsageEntry[] {
    const filePath = this.getProjectTokenFile(projectId);

    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);

    const entries: TokenUsageEntry[] = lines.map(line => JSON.parse(line));

    // Sort by timestamp descending (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination if specified
    if (limit !== undefined) {
      const start = offset || 0;
      return entries.slice(start, start + limit);
    }

    return entries;
  }

  /**
   * Get total count of entries for a project
   */
  getCount(projectId: string): number {
    const filePath = this.getProjectTokenFile(projectId);

    if (!fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    return lines.length;
  }

  /**
   * Get statistics for a project
   */
  getStats(projectId: string): TokenUsageStats {
    const entries = this.getAllEntries(projectId);

    const stats: TokenUsageStats = {
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      totalRequests: entries.length,
      byType: {},
      byModel: {}
    };

    for (const entry of entries) {
      stats.totalTokens += entry.totalTokens;
      stats.totalInputTokens += entry.inputTokens;
      stats.totalOutputTokens += entry.outputTokens;
      stats.totalCost += entry.estimatedCost;

      // By type
      if (!stats.byType[entry.type]) {
        stats.byType[entry.type] = { count: 0, tokens: 0, cost: 0 };
      }
      stats.byType[entry.type].count++;
      stats.byType[entry.type].tokens += entry.totalTokens;
      stats.byType[entry.type].cost += entry.estimatedCost;

      // By model
      if (!stats.byModel[entry.model]) {
        stats.byModel[entry.model] = { count: 0, tokens: 0, cost: 0 };
      }
      stats.byModel[entry.model].count++;
      stats.byModel[entry.model].tokens += entry.totalTokens;
      stats.byModel[entry.model].cost += entry.estimatedCost;
    }

    return stats;
  }

  /**
   * Get entries filtered by type
   */
  getEntriesByType(projectId: string, type: TokenUsageEntry['type']): TokenUsageEntry[] {
    const allEntries = this.getAllEntries(projectId);
    return allEntries.filter(entry => entry.type === type);
  }

  /**
   * Get entries within a date range
   */
  getEntriesByDateRange(projectId: string, startDate: Date, endDate: Date): TokenUsageEntry[] {
    const allEntries = this.getAllEntries(projectId);
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Clear all entries for a project (use with caution)
   */
  clearEntries(projectId: string): void {
    const filePath = this.getProjectTokenFile(projectId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleared token usage data for project ${projectId}`);
    }
  }
}
