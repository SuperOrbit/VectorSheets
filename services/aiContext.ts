import { SpreadsheetRow } from '../types';

export class AIContextManager {
  private context: {
    userPreferences: Record<string, any>;
    frequentQueries: Map<string, number>;
    dataPatterns: string[];
    learnings: string[];
  };

  constructor() {
    this.context = {
      userPreferences: {},
      frequentQueries: new Map(),
      dataPatterns: [],
      learnings: []
    };
  }

  recordQuery(query: string) {
    const count = this.context.frequentQueries.get(query) || 0;
    this.context.frequentQueries.set(query, count + 1);
  }

  getSuggestedQueries(): string[] {
    // Return top 5 most frequent queries
    return Array.from(this.context.frequentQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);
  }

  learnFromFeedback(query: string, response: string, feedback: 'positive' | 'negative') {
    if (feedback === 'positive') {
      this.context.learnings.push(`Good: "${query}" -> "${response}"`);
    }
  }

  detectDataPatterns(data: SpreadsheetRow[]): string[] {
    const patterns = [];
    
    // Detect seasonality
    // Detect outliers
    // Detect correlations
    
    return patterns;
  }
}