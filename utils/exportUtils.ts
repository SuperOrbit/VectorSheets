import type { ChatMessage, ChartData } from '../types';

export interface ExportOptions {
  format: 'markdown' | 'text' | 'html' | 'json';
  includeCharts?: boolean;
  includeCodeBlocks?: boolean;
}

/**
 * Export AI conversation as markdown
 */
export const exportAsMarkdown = (messages: ChatMessage[], chartData?: ChartData | null): string => {
  let markdown = '# VectorSheet AI Conversation\n\n';
  markdown += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '**You**' : '**AI Assistant**';
    markdown += `## ${role}\n\n`;
    
    // Format content with code blocks
    let content = msg.content;
    
    // Preserve code blocks
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2\n```');
    
    markdown += `${content}\n\n`;
    
    if (msg.timestamp) {
      markdown += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
    }
    
    markdown += '---\n\n';
  });

  if (chartData) {
    markdown += `## Chart: ${chartData.title}\n\n`;
    markdown += `*Chart Type: ${chartData.chartType}*\n\n`;
    markdown += `*Note: Chart visualization not included in markdown export*\n\n`;
  }

  return markdown;
};

/**
 * Export AI conversation as plain text
 */
export const exportAsText = (messages: ChatMessage[]): string => {
  let text = 'VectorSheet AI Conversation\n';
  text += `Exported on ${new Date().toLocaleString()}\n\n`;
  text += '='.repeat(50) + '\n\n';

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'YOU' : 'AI ASSISTANT';
    text += `${role}:\n`;
    text += '-'.repeat(30) + '\n';
    text += `${msg.content}\n\n`;
    
    if (msg.timestamp) {
      text += `[${new Date(msg.timestamp).toLocaleString()}]\n\n`;
    }
  });

  return text;
};

/**
 * Export AI conversation as HTML
 */
export const exportAsHTML = (messages: ChatMessage[], chartData?: ChartData | null): string => {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VectorSheet AI Conversation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    .message { margin: 20px 0; padding: 15px; border-radius: 8px; }
    .user { background: #e3f2fd; border-left: 4px solid #2196f3; }
    .assistant { background: #f5f5f5; border-left: 4px solid #4caf50; }
    .timestamp { font-size: 0.85em; color: #666; margin-top: 10px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>VectorSheet AI Conversation</h1>
  <p><em>Exported on ${new Date().toLocaleString()}</em></p>
  <hr>
`;

  messages.forEach((msg) => {
    const roleClass = msg.role === 'user' ? 'user' : 'assistant';
    const roleLabel = msg.role === 'user' ? 'You' : 'AI Assistant';
    
    // Format content with code blocks
    let content = msg.content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    
    html += `
  <div class="message ${roleClass}">
    <h2>${roleLabel}</h2>
    <div>${content}</div>
    ${msg.timestamp ? `<div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>` : ''}
  </div>
`;
  });

  if (chartData) {
    html += `
  <div class="message">
    <h2>Chart: ${chartData.title}</h2>
    <p><em>Chart Type: ${chartData.chartType}</em></p>
    <p><em>Note: Chart visualization not included in HTML export</em></p>
  </div>
`;
  }

  html += `
</body>
</html>`;

  return html;
};

/**
 * Export AI conversation as JSON
 */
export const exportAsJSON = (messages: ChatMessage[], chartData?: ChartData | null): string => {
  const exportData = {
    exportDate: new Date().toISOString(),
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      feedback: msg.feedback || null,
    })),
    chartData: chartData || null,
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Export code blocks from messages
 */
export const exportCodeBlocks = (messages: ChatMessage[]): string => {
  const codeBlocks: string[] = [];
  
  messages.forEach((msg) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(msg.content)) !== null) {
      const lang = match[1] || 'text';
      const code = match[2];
      codeBlocks.push(`// ${lang}\n${code}\n`);
    }
  });

  return codeBlocks.join('\n---\n\n');
};

/**
 * Download file
 */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

