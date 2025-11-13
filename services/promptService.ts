/**
 * Prompt Service for saving, managing, and suggesting prompts
 */

import { analyticsService } from './analyticsService';
import type { SpreadsheetRow } from '../types';

export interface SavedPrompt {
  id: string;
  prompt: string;
  category: string;
  tags: string[];
  createdAt: string;
  lastUsed: string;
  useCount: number;
  isFavorite: boolean;
}

export interface PromptSuggestion {
  prompt: string;
  category: string;
  confidence: number;
  reason: string;
}

class PromptService {
  private savedPrompts: SavedPrompt[] = [];

  constructor() {
    this.loadSavedPrompts();
  }

  /**
   * Save a prompt
   */
  savePrompt(prompt: string, category?: string, tags: string[] = []): SavedPrompt {
    const savedPrompt: SavedPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      category: category || this.categorizePrompt(prompt),
      tags,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1,
      isFavorite: false,
    };

    this.savedPrompts.push(savedPrompt);
    this.savePrompts();
    return savedPrompt;
  }

  /**
   * Get saved prompts
   */
  getSavedPrompts(favoritesOnly: boolean = false): SavedPrompt[] {
    let prompts = [...this.savedPrompts];
    if (favoritesOnly) {
      prompts = prompts.filter(p => p.isFavorite);
    }
    return prompts.sort((a, b) => {
      // Sort by favorite first, then by use count, then by last used
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (b.useCount !== a.useCount) return b.useCount - a.useCount;
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    });
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(promptId: string): void {
    const prompt = this.savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite;
      this.savePrompts();
    }
  }

  /**
   * Delete a saved prompt
   */
  deletePrompt(promptId: string): void {
    this.savedPrompts = this.savedPrompts.filter(p => p.id !== promptId);
    this.savePrompts();
  }

  /**
   * Update prompt usage
   */
  recordUsage(promptId: string): void {
    const prompt = this.savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      prompt.useCount++;
      prompt.lastUsed = new Date().toISOString();
      this.savePrompts();
    }
  }

  /**
   * Generate contextual suggestions based on:
   * - Data type and structure
   * - User history (analytics)
   * - Spreadsheet activity
   */
  generateContextualSuggestions(
    sheetData: SpreadsheetRow[],
    recentPrompts: string[] = [],
    activeColumns: string[] = []
  ): PromptSuggestion[] {
    const suggestions: PromptSuggestion[] = [];

    // 1. Data-type based suggestions
    if (sheetData.length > 0) {
      const columns = Object.keys(sheetData[0]);
      const numericColumns = columns.filter(col => {
        const sample = sheetData[0]?.[col];
        return typeof sample === 'number';
      });
      const textColumns = columns.filter(col => {
        const sample = sheetData[0]?.[col];
        return typeof sample === 'string';
      });

      // Numeric data suggestions
      if (numericColumns.length > 0) {
        suggestions.push({
          prompt: `Calculate the sum and average of ${numericColumns[0]}`,
          category: 'calculation',
          confidence: 0.9,
          reason: 'Numeric column detected',
        });

        if (numericColumns.length >= 2) {
          suggestions.push({
            prompt: `Compare ${numericColumns[0]} and ${numericColumns[1]}`,
            category: 'analysis',
            confidence: 0.85,
            reason: 'Multiple numeric columns available',
          });
        }
      }

      // Text data suggestions
      if (textColumns.length > 0) {
        suggestions.push({
          prompt: `Group and count by ${textColumns[0]}`,
          category: 'aggregation',
          confidence: 0.8,
          reason: 'Text column detected',
        });
      }

      // Date/time patterns
      const dateColumns = columns.filter(col => {
        const colName = col.toLowerCase();
        return colName.includes('date') || colName.includes('time') || colName.includes('month') || colName.includes('year');
      });
      if (dateColumns.length > 0 && numericColumns.length > 0) {
        suggestions.push({
          prompt: `Show trends over time for ${numericColumns[0]}`,
          category: 'visualization',
          confidence: 0.9,
          reason: 'Time-series data detected',
        });
      }
    }

    // 2. User history based suggestions (from analytics)
    const promptAnalytics = analyticsService.getPromptAnalytics();
    const topPrompts = promptAnalytics.slice(0, 5);
    topPrompts.forEach(item => {
      if (!recentPrompts.includes(item.prompt)) {
        suggestions.push({
          prompt: item.prompt,
          category: item.category || 'general',
          confidence: 0.7 + (item.count / 100), // Higher confidence for more used prompts
          reason: `Frequently used (${item.count} times)`,
        });
      }
    });

    // 3. Activity-based suggestions
    if (activeColumns.length > 0) {
      suggestions.push({
        prompt: `Analyze the selected ${activeColumns.join(', ')} columns`,
        category: 'analysis',
        confidence: 0.75,
        reason: 'Based on current selection',
      });
    }

    // 4. Saved prompts suggestions
    const favoritePrompts = this.getSavedPrompts(true);
    favoritePrompts.slice(0, 3).forEach(prompt => {
      if (!recentPrompts.includes(prompt.prompt)) {
        suggestions.push({
          prompt: prompt.prompt,
          category: prompt.category,
          confidence: 0.8,
          reason: 'From your favorites',
        });
      }
    });

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);
  }

  /**
   * Categorize prompt
   */
  private categorizePrompt(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('summarize') || lower.includes('summary')) return 'summary';
    if (lower.includes('explain') || lower.includes('what')) return 'explanation';
    if (lower.includes('formula') || lower.includes('calculate')) return 'formula';
    if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualize')) return 'visualization';
    if (lower.includes('filter') || lower.includes('sort')) return 'data_manipulation';
    if (lower.includes('analyze') || lower.includes('analysis')) return 'analysis';
    if (lower.includes('compare') || lower.includes('difference')) return 'comparison';
    if (lower.includes('trend') || lower.includes('pattern')) return 'trend_analysis';
    return 'general';
  }

  /**
   * Load saved prompts from localStorage
   */
  private loadSavedPrompts(): void {
    try {
      const stored = localStorage.getItem('saved_prompts');
      if (stored) {
        this.savedPrompts = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load saved prompts:', e);
      this.savedPrompts = [];
    }
  }

  /**
   * Save prompts to localStorage
   */
  private savePrompts(): void {
    try {
      localStorage.setItem('saved_prompts', JSON.stringify(this.savedPrompts));
    } catch (e) {
      console.warn('Failed to save prompts:', e);
    }
  }
}

export const promptService = new PromptService();

