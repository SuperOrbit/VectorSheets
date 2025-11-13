/**
 * Analytics Service for VectorSheet
 * Tracks user activity, prompts, errors, and exports
 */

export interface AnalyticsEvent {
  type: 'prompt' | 'export' | 'error' | 'action' | 'user_activity';
  timestamp: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
}

export interface PromptAnalytics {
  prompt: string;
  count: number;
  successRate: number;
  avgResponseTime?: number;
  lastUsed: string;
  category?: string;
}

export interface ExportAnalytics {
  format: 'markdown' | 'text' | 'html' | 'json' | 'code' | 'csv' | 'excel' | 'google_sheets';
  count: number;
  lastUsed: string;
}

export interface ErrorAnalytics {
  errorType: string;
  count: number;
  lastOccurred: string;
  canRetry: boolean;
}

export interface UserActivity {
  userId: string;
  sessionId: string;
  activeTime: number; // in seconds
  promptsCount: number;
  exportsCount: number;
  errorsCount: number;
  lastActive: string;
}

class AnalyticsService {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.loadEvents();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored);
        // Keep only last 1000 events
        if (this.events.length > 1000) {
          this.events = this.events.slice(-1000);
        }
      }
    } catch (e) {
      console.warn('Failed to load analytics events:', e);
      this.events = [];
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch (e) {
      console.warn('Failed to save analytics events:', e);
    }
  }

  /**
   * Track an analytics event
   */
  track(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.isEnabled) return;

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: event.userId || this.getUserId(),
    };

    this.events.push(fullEvent);
    this.saveEvents();

    // In production, also send to analytics service
    // this.sendToServer(fullEvent);
  }

  /**
   * Track a prompt
   */
  trackPrompt(prompt: string, modelMode: string, success: boolean, responseTime?: number): void {
    this.track({
      type: 'prompt',
      data: {
        prompt: prompt.substring(0, 200), // Limit length
        modelMode,
        success,
        responseTime,
        category: this.categorizePrompt(prompt),
      },
    });
  }

  /**
   * Track an export
   */
  trackExport(format: string): void {
    this.track({
      type: 'export',
      data: { format },
    });
  }

  /**
   * Track an error
   */
  trackError(errorType: string, errorMessage: string, canRetry: boolean): void {
    this.track({
      type: 'error',
      data: {
        errorType,
        errorMessage: errorMessage.substring(0, 200),
        canRetry,
      },
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, metadata?: Record<string, any>): void {
    this.track({
      type: 'action',
      data: {
        action,
        ...metadata,
      },
    });
  }

  /**
   * Track user activity
   */
  trackActivity(activeTime: number): void {
    this.track({
      type: 'user_activity',
      data: { activeTime },
    });
  }

  /**
   * Get prompt popularity analytics
   */
  getPromptAnalytics(): PromptAnalytics[] {
    const promptMap = new Map<string, { count: number; successes: number; responseTimes: number[]; lastUsed: string }>();

    this.events
      .filter(e => e.type === 'prompt')
      .forEach(event => {
        const prompt = event.data.prompt;
        const existing = promptMap.get(prompt) || { count: 0, successes: 0, responseTimes: [], lastUsed: event.timestamp };
        
        existing.count++;
        if (event.data.success) existing.successes++;
        if (event.data.responseTime) existing.responseTimes.push(event.data.responseTime);
        if (event.timestamp > existing.lastUsed) existing.lastUsed = event.timestamp;
        
        promptMap.set(prompt, existing);
      });

    return Array.from(promptMap.entries())
      .map(([prompt, data]) => ({
        prompt,
        count: data.count,
        successRate: data.count > 0 ? data.successes / data.count : 0,
        avgResponseTime: data.responseTimes.length > 0 
          ? data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length 
          : undefined,
        lastUsed: data.lastUsed,
        category: this.categorizePrompt(prompt),
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get export analytics
   */
  getExportAnalytics(): ExportAnalytics[] {
    const exportMap = new Map<string, { count: number; lastUsed: string }>();

    this.events
      .filter(e => e.type === 'export')
      .forEach(event => {
        const format = event.data.format;
        const existing = exportMap.get(format) || { count: 0, lastUsed: event.timestamp };
        
        existing.count++;
        if (event.timestamp > existing.lastUsed) existing.lastUsed = event.timestamp;
        
        exportMap.set(format, existing);
      });

    return Array.from(exportMap.entries())
      .map(([format, data]) => ({
        format: format as ExportAnalytics['format'],
        count: data.count,
        lastUsed: data.lastUsed,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get error analytics
   */
  getErrorAnalytics(): ErrorAnalytics[] {
    const errorMap = new Map<string, { count: number; lastOccurred: string; canRetry: boolean }>();

    this.events
      .filter(e => e.type === 'error')
      .forEach(event => {
        const errorType = event.data.errorType;
        const existing = errorMap.get(errorType) || { count: 0, lastOccurred: event.timestamp, canRetry: event.data.canRetry };
        
        existing.count++;
        if (event.timestamp > existing.lastOccurred) existing.lastOccurred = event.timestamp;
        
        errorMap.set(errorType, existing);
      });

    return Array.from(errorMap.entries())
      .map(([errorType, data]) => ({
        errorType,
        count: data.count,
        lastOccurred: data.lastOccurred,
        canRetry: data.canRetry,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get active users count (unique sessions in last 24 hours)
   */
  getActiveUsersCount(): number {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const uniqueSessions = new Set(
      this.events
        .filter(e => e.timestamp >= last24Hours)
        .map(e => e.sessionId)
    );
    return uniqueSessions.size;
  }

  /**
   * Get user activity summary
   */
  getUserActivity(): UserActivity {
    const userId = this.getUserId();
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    
    const promptsCount = sessionEvents.filter(e => e.type === 'prompt').length;
    const exportsCount = sessionEvents.filter(e => e.type === 'export').length;
    const errorsCount = sessionEvents.filter(e => e.type === 'error').length;
    
    const activityEvents = sessionEvents.filter(e => e.type === 'user_activity');
    const activeTime = activityEvents.reduce((sum, e) => sum + (e.data.activeTime || 0), 0);
    
    const lastActive = sessionEvents.length > 0 
      ? sessionEvents[sessionEvents.length - 1].timestamp 
      : new Date().toISOString();

    return {
      userId,
      sessionId: this.sessionId,
      activeTime,
      promptsCount,
      exportsCount,
      errorsCount,
      lastActive,
    };
  }

  /**
   * Categorize prompt
   */
  private categorizePrompt(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('summarize') || lower.includes('summary')) return 'summary';
    if (lower.includes('explain') || lower.includes('what')) return 'explanation';
    if (lower.includes('formula') || lower.includes('calculate')) return 'formula';
    if (lower.includes('chart') || lower.includes('graph')) return 'visualization';
    if (lower.includes('filter') || lower.includes('sort')) return 'data_manipulation';
    if (lower.includes('analyze') || lower.includes('analysis')) return 'analysis';
    return 'general';
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('analytics_enabled', String(enabled));
  }

  /**
   * Check if analytics is enabled
   */
  isAnalyticsEnabled(): boolean {
    const stored = localStorage.getItem('analytics_enabled');
    return stored !== null ? stored === 'true' : this.isEnabled;
  }

  /**
   * Clear all analytics data
   */
  clear(): void {
    this.events = [];
    this.saveEvents();
  }

  /**
   * Export analytics data
   */
  export(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      userId: this.getUserId(),
      events: this.events,
      summary: {
        promptAnalytics: this.getPromptAnalytics(),
        exportAnalytics: this.getExportAnalytics(),
        errorAnalytics: this.getErrorAnalytics(),
        activeUsers: this.getActiveUsersCount(),
        userActivity: this.getUserActivity(),
      },
    }, null, 2);
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

