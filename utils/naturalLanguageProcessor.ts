export class NaturalLanguageProcessor {
  static extractIntent(query: string): {
    action: string;
    entities: Record<string, any>;
    confidence: number;
  } {
    const query_lower = query.toLowerCase();
    
    // Detect aggregation intents
    if (/total|sum|add up/.test(query_lower)) {
      return {
        action: 'aggregate',
        entities: { operation: 'sum', column: this.extractColumn(query) },
        confidence: 0.9
      };
    }
    
    // Detect filtering intents
    if (/show|filter|find|get.*where/.test(query_lower)) {
      return {
        action: 'filter',
        entities: { conditions: this.extractConditions(query) },
        confidence: 0.85
      };
    }
    
    // Detect visualization intents
    if (/chart|graph|plot|visualize/.test(query_lower)) {
      return {
        action: 'visualize',
        entities: { chartType: this.extractChartType(query) },
        confidence: 0.8
      };
    }
    
    return { action: 'unknown', entities: {}, confidence: 0.3 };
  }

  static extractColumn(query: string): string | null {
    const columns = ['sales', 'profit', 'cost', 'month', 'product', 'region'];
    for (const col of columns) {
      if (query.toLowerCase().includes(col)) {
        return col;
      }
    }
    return null;
  }

  static extractConditions(query: string): Array<{ column: string; operator: string; value: any }> {
    // Parse conditions like "profit > 5000" or "region = North"
    const conditions = [];
    
    const patterns = [
      /(\w+)\s*(>|<|=|>=|<=)\s*(\d+)/g,
      /(\w+)\s*=\s*['"]([^'"]+)['"]/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        conditions.push({
          column: match[1],
          operator: match[2],
          value: match[3]
        });
      }
    }
    
    return conditions;
  }

  static extractChartType(query: string): string | null {
    const query_lower = query.toLowerCase();
    if (query_lower.includes('pie chart')) return 'pie';
    if (query_lower.includes('bar chart')) return 'bar';
    if (query_lower.includes('line chart')) return 'line';
    return null;
  }
}