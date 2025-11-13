import type { SpreadsheetRow, Suggestion } from '../types';

/**
 * Analyzes sheet data and generates contextual suggestions based on content
 */
export const generateSuggestions = (sheetData: SpreadsheetRow[]): Suggestion[] => {
  if (!sheetData || sheetData.length === 0) {
    return [
      { text: 'Add some data to get started', category: 'general' },
      { text: 'Import data from CSV', category: 'general' },
    ];
  }

  const suggestions: Suggestion[] = [];
  const columns = Object.keys(sheetData[0] || {});
  const numericColumns = columns.filter(col => {
    const sample = sheetData[0]?.[col];
    return typeof sample === 'number';
  });
  const textColumns = columns.filter(col => {
    const sample = sheetData[0]?.[col];
    return typeof sample === 'string';
  });

  // Detect common patterns
  const hasRegion = textColumns.some(col => 
    col.toLowerCase().includes('region') || 
    col.toLowerCase().includes('location')
  );
  const hasMonth = textColumns.some(col => 
    col.toLowerCase().includes('month') || 
    col.toLowerCase().includes('date')
  );
  const hasSales = numericColumns.some(col => 
    col.toLowerCase().includes('sales') || 
    col.toLowerCase().includes('revenue')
  );
  const hasProfit = numericColumns.some(col => 
    col.toLowerCase().includes('profit') || 
    col.toLowerCase().includes('margin')
  );

  // Analysis suggestions
  if (numericColumns.length > 0) {
    if (hasSales && hasRegion) {
      suggestions.push({
        text: 'Summarize sales by region',
        category: 'analysis',
        icon: '📊',
      });
    }
    if (hasSales && hasMonth) {
      suggestions.push({
        text: 'Show sales trends by month',
        category: 'analysis',
        icon: '📈',
      });
    }
    if (hasProfit) {
      suggestions.push({
        text: 'Find top 5 most profitable items',
        category: 'analysis',
        icon: '🏆',
      });
    }
    if (numericColumns.length >= 2) {
      suggestions.push({
        text: 'Calculate total and average for all numeric columns',
        category: 'analysis',
        icon: '🔢',
      });
    }
  }

  // Formula suggestions
  if (numericColumns.length >= 2) {
    suggestions.push({
      text: 'Create a formula to calculate profit margin',
      category: 'formula',
      icon: '🧮',
    });
    if (hasSales && hasProfit) {
      suggestions.push({
        text: 'Calculate profit percentage',
        category: 'formula',
        icon: '📐',
      });
    }
  }

  // Filter suggestions
  if (textColumns.length > 0) {
    const firstTextCol = textColumns[0];
    suggestions.push({
      text: `Filter by ${firstTextCol}`,
      category: 'filter',
      icon: '🔍',
    });
  }

  // Sort suggestions
  if (numericColumns.length > 0) {
    const firstNumericCol = numericColumns[0];
    suggestions.push({
      text: `Sort by ${firstNumericCol} (descending)`,
      category: 'sort',
      icon: '⬇️',
    });
  }

  // Chart suggestions
  if (hasSales && (hasRegion || hasMonth)) {
    suggestions.push({
      text: 'Create a bar chart showing sales distribution',
      category: 'chart',
      icon: '📊',
    });
  }
  if (hasSales && hasMonth) {
    suggestions.push({
      text: 'Create a line chart showing sales over time',
      category: 'chart',
      icon: '📈',
    });
  }

  // General suggestions
  suggestions.push({
    text: 'Analyze this data and provide insights',
    category: 'general',
    icon: '💡',
  });

  return suggestions.slice(0, 6); // Limit to 6 suggestions
};

