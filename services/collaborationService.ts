/**
 * Collaboration Service for @mentions, comments, and permissions
 */

export interface Comment {
  id: string;
  cellRef: string; // e.g., "A1" or "A1:B5"
  author: string;
  authorId: string;
  content: string;
  mentions: string[]; // User IDs mentioned
  createdAt: string;
  updatedAt: string;
  resolved: boolean;
}

export interface Mention {
  id: string;
  userId: string;
  userName: string;
  context: string; // Where the mention occurred
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Permission {
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  canEdit: boolean;
  canComment: boolean;
  canView: boolean;
}

export interface CollaborationSession {
  sessionId: string;
  userId: string;
  userName: string;
  isActive: boolean;
  lastActive: string;
  cursorPosition?: string; // e.g., "A1"
}

class CollaborationService {
  private comments: Comment[] = [];
  private mentions: Mention[] = [];
  private permissions: Permission[] = [];
  private activeUsers: CollaborationSession[] = [];
  private currentUserId: string;

  constructor() {
    this.currentUserId = this.getOrCreateUserId();
    this.loadData();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('collab_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('collab_user_id', userId);
    }
    return userId;
  }

  private getCurrentUserName(): string {
    return localStorage.getItem('collab_user_name') || 'User';
  }

  /**
   * Add a comment to a cell or range
   */
  addComment(cellRef: string, content: string, mentions: string[] = []): Comment {
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cellRef,
      author: this.getCurrentUserName(),
      authorId: this.currentUserId,
      content,
      mentions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolved: false,
    };

    this.comments.push(comment);
    this.saveData();

    // Create mentions for mentioned users
    mentions.forEach(userId => {
      this.createMention(userId, `You were mentioned in a comment on ${cellRef}`, content);
    });

    return comment;
  }

  /**
   * Get comments for a cell or range
   */
  getComments(cellRef: string): Comment[] {
    return this.comments.filter(c => c.cellRef === cellRef || c.cellRef.includes(cellRef));
  }

  /**
   * Resolve a comment
   */
  resolveComment(commentId: string): void {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = true;
      comment.updatedAt = new Date().toISOString();
      this.saveData();
    }
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): void {
    this.comments = this.comments.filter(c => c.id !== commentId);
    this.saveData();
  }

  /**
   * Parse @mentions from text
   */
  parseMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (!matches) return [];
    
    // Extract user IDs from @mentions
    // In production, this would look up users by username
    return matches.map(match => match.substring(1));
  }

  /**
   * Create a mention notification
   */
  createMention(userId: string, context: string, message: string): Mention {
    const mention: Mention = {
      id: `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName: this.getUserName(userId),
      context,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    this.mentions.push(mention);
    this.saveData();
    return mention;
  }

  /**
   * Get unread mentions for current user
   */
  getUnreadMentions(): Mention[] {
    return this.mentions
      .filter(m => m.userId === this.currentUserId && !m.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Mark mention as read
   */
  markMentionRead(mentionId: string): void {
    const mention = this.mentions.find(m => m.id === mentionId);
    if (mention) {
      mention.read = true;
      this.saveData();
    }
  }

  /**
   * Set user permissions
   */
  setPermission(userId: string, userName: string, role: Permission['role']): void {
    const permission: Permission = {
      userId,
      userName,
      role,
      canEdit: role === 'owner' || role === 'editor',
      canComment: role === 'owner' || role === 'editor' || role === 'commenter',
      canView: true, // All roles can view
    };

    const existing = this.permissions.findIndex(p => p.userId === userId);
    if (existing >= 0) {
      this.permissions[existing] = permission;
    } else {
      this.permissions.push(permission);
    }
    this.saveData();
  }

  /**
   * Get permissions for current user
   */
  getCurrentUserPermissions(): Permission | null {
    return this.permissions.find(p => p.userId === this.currentUserId) || null;
  }

  /**
   * Check if user can perform action
   */
  canPerformAction(action: 'edit' | 'comment' | 'view'): boolean {
    const permission = this.getCurrentUserPermissions();
    if (!permission) return true; // Default to allow if no permissions set

    switch (action) {
      case 'edit':
        return permission.canEdit;
      case 'comment':
        return permission.canComment;
      case 'view':
        return permission.canView;
      default:
        return false;
    }
  }

  /**
   * Track active user session
   */
  trackActiveUser(userName: string, cursorPosition?: string): void {
    const existing = this.activeUsers.findIndex(u => u.userId === this.currentUserId);
    const session: CollaborationSession = {
      sessionId: `session_${Date.now()}`,
      userId: this.currentUserId,
      userName,
      isActive: true,
      lastActive: new Date().toISOString(),
      cursorPosition,
    };

    if (existing >= 0) {
      this.activeUsers[existing] = session;
    } else {
      this.activeUsers.push(session);
    }
    this.saveData();
  }

  /**
   * Get active users
   */
  getActiveUsers(): CollaborationSession[] {
    // Filter out inactive users (last active > 5 minutes ago)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    return this.activeUsers.filter(u => u.lastActive >= fiveMinutesAgo);
  }

  /**
   * Helper to get user name (placeholder)
   */
  private getUserName(userId: string): string {
    const permission = this.permissions.find(p => p.userId === userId);
    return permission?.userName || 'User';
  }

  /**
   * Load data from localStorage
   */
  private loadData(): void {
    try {
      const comments = localStorage.getItem('collab_comments');
      if (comments) this.comments = JSON.parse(comments);

      const mentions = localStorage.getItem('collab_mentions');
      if (mentions) this.mentions = JSON.parse(mentions);

      const permissions = localStorage.getItem('collab_permissions');
      if (permissions) this.permissions = JSON.parse(permissions);

      const activeUsers = localStorage.getItem('collab_active_users');
      if (activeUsers) this.activeUsers = JSON.parse(activeUsers);
    } catch (e) {
      console.warn('Failed to load collaboration data:', e);
    }
  }

  /**
   * Save data to localStorage
   */
  private saveData(): void {
    try {
      localStorage.setItem('collab_comments', JSON.stringify(this.comments));
      localStorage.setItem('collab_mentions', JSON.stringify(this.mentions));
      localStorage.setItem('collab_permissions', JSON.stringify(this.permissions));
      localStorage.setItem('collab_active_users', JSON.stringify(this.activeUsers));
    } catch (e) {
      console.warn('Failed to save collaboration data:', e);
    }
  }
}

export const collaborationService = new CollaborationService();

