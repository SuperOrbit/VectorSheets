import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from '@google/generative-ai';
import type { AIResponse, ConversationContext, FunctionCallAction, SpreadsheetRow } from '../types';

export type ModelMode = 'auto' | 'max' | 'gemini-pro' | 'gemini-flash';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


// Don't throw error immediately - let the app load and handle it gracefully
let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }
} else {
  console.warn('VITE_GEMINI_API_KEY is not set. Please set it in your .env.local file.');
}

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds
const MAX_DELAY = 32000; // 32 seconds

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Exponential backoff with jitter
const getRetryDelay = (attempt: number): number => {
  const exponentialDelay = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
  const jitter = Math.random() * 1000; // Random jitter up to 1 second
  return exponentialDelay + jitter;
};

// ADD: More intelligent prompt engineering
const buildSystemPrompt = (data: SpreadsheetRow[], context: ConversationContext) => {
  return `You are VectorSheet AI, an expert data analyst assistant.

CURRENT DATA SUMMARY:
- Total Rows: ${data.length}
- Columns: ${Object.keys(data[0] || {}).join(', ')}

AVAILABLE COLUMNS & TYPES:
${Object.keys(data[0] || {}).map(col => {
  const sampleValue = data[0][col];
  const type = typeof sampleValue === 'number' ? 'numeric' : 'text';
  return `- ${col}: ${type}`;
}).join('\n')}

RECENT ACTIONS:
${context.actions.slice(-3).map(a => `- ${a.name}: ${JSON.stringify(a.args)}`).join('\n')}

INSTRUCTIONS:
1. Understand the user's intent from natural language
2. Use appropriate functions to answer questions
3. Provide clear, concise explanations
4. Suggest follow-up actions when relevant
5. Format numbers with proper thousand separators
6. Always validate data before operations

When user asks vague questions like "analyze this", provide:
- Key statistics (sum, average, min, max)
- Trends and patterns
- Outliers or anomalies
- Actionable insights`;
};

// ADD: Multi-step reasoning
const planMultiStepOperation = (userInput: string, data: SpreadsheetRow[]) => {
  // Break complex queries into steps
  // Example: "Show me top 5 products by profit in the North region"
  // Step 1: Filter by North
  // Step 2: Find top 5 by profit
  // Step 3: Display results
};



// ADD: Better function declarations
const ENHANCED_FUNCTIONS = [
  {
    name: "analyze_data",
    description: "Performs comprehensive analysis including trends, outliers, correlations, and insights",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        columns: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Columns to analyze. If empty, analyzes all numeric columns."
        },
        analysisType: {
          type: SchemaType.STRING,
          enum: ["summary", "trends", "outliers", "correlations", "full"],
          description: "Type of analysis to perform"
        }
      }
    }
  },
  {
    name: "generate_formula",
    description: "Generates Excel/Google Sheets formulas from natural language",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        description: {
          type: SchemaType.STRING,
          description: "What the formula should calculate (e.g., 'calculate profit margin')"
        },
        targetColumn: {
          type: SchemaType.STRING,
          description: "Column where formula result should go"
        }
      },
      required: ["description"]
    }
  },
  {
    name: "smart_search",
    description: "Searches data using natural language queries with fuzzy matching",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: "Natural language search query"
        },
        maxResults: {
          type: SchemaType.NUMBER,
          description: "Maximum number of results to return"
        }
      },
      required: ["query"]
    }
  }
];

// Determine if a query is complex (requires gemini-pro)
const isComplexQuery = (userInput: string): boolean => {
  const complexKeywords = [
    'analyze', 'analysis', 'correlation', 'trend', 'insight', 'pattern',
    'complex', 'multi-step', 'detailed', 'comprehensive', 'deep', 'thorough',
    'reasoning', 'explain why', 'what if', 'predict', 'forecast'
  ];
  const queryLower = userInput.toLowerCase();
  return complexKeywords.some(keyword => queryLower.includes(keyword)) || userInput.length > 200;
};

// Get the actual model name based on mode
const getModelName = (mode: ModelMode, userInput: string): string => {
  switch (mode) {
    case 'max':
      return 'gemini-pro-latest';
    case 'gemini-pro':
      return 'gemini-pro-latest';
    case 'gemini-flash':
      return 'gemini-flash-latest';
    case 'auto':
    default:
      // Auto mode: use pro for complex queries, flash for simple ones
      return isComplexQuery(userInput) ? 'gemini-pro-latest' : 'gemini-flash-latest';
  }
};

const getModel = (mode: ModelMode = 'auto', userInput: string = '') => {
  if (!genAI) {
    throw new Error('Gemini AI is not initialized. Please set VITE_GEMINI_API_KEY.');
  }
  const modelName = getModelName(mode, userInput);
  return genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    tools: [
    {
      functionDeclarations: [
        {
          name: "sort_data",
          description: "Sorts the spreadsheet data by a specified column in ascending or descending order.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              column: {
                type: SchemaType.STRING,
                description: "The column to sort by (e.g., 'sales', 'cost', 'profit', 'month', 'product', 'region').",
              },
              order: {
                type: SchemaType.STRING,
                enum: ["ascending", "descending"],
                description: "Sort order: 'ascending' or 'descending'.",
              },
            },
            required: ["column", "order"],
          },
        },
        {
          name: "calculate_aggregate",
          description: "Calculates sum, average, min, max, or count for a specific column. Can filter by region, product, or month if specified.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              column: {
                type: SchemaType.STRING,
                description: "Column to calculate on (e.g., 'sales', 'cost', 'profit').",
              },
              operation: {
                type: SchemaType.STRING,
                enum: ["sum", "average", "min", "max", "count"],
                description: "Type of calculation: sum, average, min, max, or count.",
              },
              filterColumn: {
                type: SchemaType.STRING,
                description: "Optional: Column to filter by (e.g., 'region', 'product', 'month').",
              },
              filterValue: {
                type: SchemaType.STRING,
                description: "Optional: Value to filter for (e.g., 'North', 'Product A', 'January').",
              },
            },
            required: ["column", "operation"],
          },
        },
        {
          name: "filter_data",
          description: "Filters spreadsheet data based on a column and value to show only matching rows.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              column: {
                type: SchemaType.STRING,
                description: "Column to filter by (e.g., 'region', 'product', 'month').",
              },
              value: {
                type: SchemaType.STRING,
                description: "Value to filter for (case-insensitive partial match).",
              },
            },
            required: ["column", "value"],
          },
        },
        {
          name: "add_row",
          description: "Adds a new row to the spreadsheet with the specified data.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              month: { type: SchemaType.STRING, description: "Month name (e.g., 'January')" },
              product: { type: SchemaType.STRING, description: "Product name (e.g., 'Product A')" },
              region: { type: SchemaType.STRING, description: "Region name (e.g., 'North')" },
              sales: { type: SchemaType.NUMBER, description: "Sales amount" },
              cost: { type: SchemaType.NUMBER, description: "Cost amount" },
              profit: { type: SchemaType.NUMBER, description: "Profit amount" },
            },
            required: ["month", "product", "region", "sales", "cost", "profit"],
          },
        },
        {
          name: "update_cell",
          description: "Updates a specific cell value in the spreadsheet by row index and column name.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              rowIndex: {
                type: SchemaType.NUMBER,
                description: "Row index (0-based) to update. First row is 0, second is 1, etc.",
              },
              column: {
                type: SchemaType.STRING,
                description: "Column to update (e.g., 'sales', 'cost', 'profit', 'product', 'region', 'month').",
              },
              value: {
                type: SchemaType.STRING,
                description: "New value to set (will be converted to number for numeric columns).",
              },
            },
            required: ["rowIndex", "column", "value"],
          },
        },
        {
          name: "find_top_n",
          description: "Finds and displays the top N rows ranked by a specified column value (highest to lowest).",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              column: {
                type: SchemaType.STRING,
                description: "Column to rank by (e.g., 'sales', 'profit', 'cost').",
              },
              n: {
                type: SchemaType.NUMBER,
                description: "Number of top results to return (e.g., 5 for top 5).",
              },
            },
            required: ["column", "n"],
          },
        },
        {
          name: "delete_rows",
          description: "Deletes one or more rows from the spreadsheet based on their indices.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              rowIndices: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.NUMBER,
                },
                description: "An array of 0-based row indices to delete.",
              },
            },
            required: ["rowIndices"],
          },
        },
        {
          name: "delete_columns",
          description: "Deletes one or more columns from the spreadsheet based on their names.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              columnNames: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.STRING,
                },
                description: "An array of column names to delete.",
              },
            },
            required: ["columnNames"],
          },
        },
        {
          name: "add_column",
          description: "Adds a new column to the spreadsheet.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              columnName: {
                type: SchemaType.STRING,
                description: "The name of the new column.",
              },
              defaultValue: {
                type: SchemaType.STRING,
                description: "The default value for the new column.",
              },
            },
            required: ["columnName"],
          },
        },
        {
          name: "format_cells",
          description: "Applies formatting to a range of cells.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              range: {
                type: SchemaType.STRING,
                description: "The range of cells to format (e.g., 'A1:C5').",
              },
              format: {
                type: SchemaType.OBJECT,
                properties: {
                  bold: { type: SchemaType.BOOLEAN },
                  italic: { type: SchemaType.BOOLEAN },
                  underline: { type: SchemaType.BOOLEAN },
                  fontColor: { type: SchemaType.STRING },
                  backgroundColor: { type: SchemaType.STRING },
                },
              },
            },
            required: ["range", "format"],
          },
        },
        {
          name: "merge_cells",
          description: "Merges a range of cells.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              range: {
                type: SchemaType.STRING,
                description: "The range of cells to merge (e.g., 'A1:C1').",
              },
            },
            required: ["range"],
          },
        },
        {
          name: "apply_formula",
          description: "Applies a formula to a cell.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              cell: {
                type: SchemaType.STRING,
                description: "The cell to apply the formula to (e.g., 'A1').",
              },
              formula: {
                type: SchemaType.STRING,
                description: "The formula to apply (e.g., '=SUM(B1:B5)').",
              },
            },
            required: ["cell", "formula"],
          },
        },
        {
          name: "duplicate_sheet",
          description: "Duplicates the current sheet.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              newName: {
                type: SchemaType.STRING,
                description: "The name of the new duplicated sheet.",
              },
            },
            required: ["newName"],
          },
        },
        {
          name: "rename_sheet",
          description: "Renames the current sheet.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              newName: {
                type: SchemaType.STRING,
                description: "The new name for the current sheet.",
              },
            },
            required: ["newName"],
          },
        },
        {
          name: "batch_update",
          description: "Performs a batch of updates to the spreadsheet.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              updates: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    rowIndex: { type: SchemaType.NUMBER },
                    column: { type: SchemaType.STRING },
                    value: { type: SchemaType.STRING },
                  },
                  required: ["rowIndex", "column", "value"],
                },
              },
            },
            required: ["updates"],
          },
        },
        {
          name: "pivot_table",
          description: "Creates a pivot table from the data.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              rows: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "The columns to use as rows in the pivot table.",
              },
              columns: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: "The columns to use as columns in the pivot table.",
              },
              values: {
                type: SchemaType.STRING,
                description: "The column to use for the values in the pivot table.",
              },
              aggregator: {
                type: SchemaType.STRING,
                enum: ["sum", "average", "count"],
                description: "The aggregation function to use.",
              },
            },
            required: ["rows", "columns", "values", "aggregator"],
          },
        },
        {
          name: "create_chart",
          description: "Creates a chart from the data.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              chartType: {
                type: SchemaType.STRING,
                enum: ["bar", "line", "pie"],
                description: "The type of chart to create.",
              },
              title: {
                type: SchemaType.STRING,
                description: "The title of the chart.",
              },
              xAxis: {
                type: SchemaType.STRING,
                description: "The column to use for the x-axis.",
              },
              yAxis: {
                type: SchemaType.STRING,
                description: "The column to use for the y-axis.",
              },
            },
            required: ["chartType", "title", "xAxis", "yAxis"],
          },
        },
        {
          name: "clear_filter",
          description: "Clears any active filters on the spreadsheet.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {},
          },
        },
        {
          name: "generate_chart",
          description: "Generates a chart from the spreadsheet data.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              chartType: {
                type: SchemaType.STRING,
                enum: ["bar", "line", "pie"],
                description: "The type of chart to generate.",
              },
              labels: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.STRING,
                },
                description: "The labels for the x-axis.",
              },
              datasets: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    label: {
                      type: SchemaType.STRING,
                      description: "The label for the dataset.",
                    },
                    data: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.NUMBER,
                      },
                      description: "The data points for the dataset.",
                    },
                  },
                  required: ["label", "data"],
                },
                description: "The datasets for the chart.",
              },
              title: {
                type: SchemaType.STRING,
                description: "The title of the chart.",
              },
            },
            required: ["chartType", "labels", "datasets", "title"],
          },
        },
      ],
    },
  ],
  });
};

export const getAIResponse = async (
  userInput: string, 
  sheetData: SpreadsheetRow[],
  context: ConversationContext,
  onRetry?: (attempt: number, delay: number) => void,
  modelMode: ModelMode = 'auto'
): Promise<AIResponse> => {
  // Check if API key is configured
  if (!API_KEY || !genAI) {
    return { 
      text: '⚠️ API Key Not Configured\n\nPlease set your VITE_GEMINI_API_KEY in a .env.local file.\n\n1. Create a .env.local file in the VectorSheets directory\n2. Add: VITE_GEMINI_API_KEY=your_api_key_here\n3. Get your API key from: https://makersuite.google.com/app/apikey\n4. Restart the development server' 
    };
  }

  if (userInput.toLowerCase().includes('chart') && !userInput.toLowerCase().includes('bar') && !userInput.toLowerCase().includes('line') && !userInput.toLowerCase().includes('pie')) {
    return { text: 'What type of chart would you like to generate? (e.g., bar, line, pie)' };
  }

  let lastError: any;
  const systemPrompt = buildSystemPrompt(sheetData, context);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = getModel(modelMode, userInput);
      const generationConfig = modelMode === 'max' ? {
        temperature: 0.7,
        maxOutputTokens: 8192,
      } : undefined;
      const chat = model.startChat({
        generationConfig,
      });
      const result = await chat.sendMessage([
        { text: systemPrompt },
        { text: `Analyze this request and use appropriate functions to help: ${userInput}` },
      ]);

      const candidate = result.response.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      if (part && 'functionCall' in part && part.functionCall) {
        const functionCall = part.functionCall;
        
        const action: FunctionCallAction = {
          name: functionCall.name as any,
          args: functionCall.args as any,
        };
        
        return { 
          text: `Processing your request: ${functionCall.name.replace('_', ' ')}...`, 
          action 
        };
      }

      const text = result.response.text();
      return { text: text || "No response from AI." };

    } catch (error: any) {
      lastError = error;
      
      // Check if it's a 503 error (overloaded) or 429 (rate limit)
      const isRetriableError = 
        error.message?.includes('503') || 
        error.message?.includes('overloaded') ||
        error.message?.includes('429') ||
        error.message?.includes('rate limit');

      if (isRetriableError && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed. Retrying in ${(delay / 1000).toFixed(1)}s...`);
        
        // Notify UI about retry
        if (onRetry) {
          onRetry(attempt + 1, delay);
        }
        
        await sleep(delay);
        continue; // Retry
      }
      
      // If not retriable or max retries reached, throw error
      break;
    }
  }

  // All retries failed - Enhanced error handling
  console.error("All retry attempts failed:", lastError);
  
  // Log error for debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: lastError.message || 'Unknown error',
    stack: lastError.stack,
    userInput: userInput.substring(0, 100), // Log first 100 chars
    modelMode,
    retryAttempts: MAX_RETRIES + 1,
  };
  
  // Log to console (in production, send to error tracking service)
  console.error('AI Error Log:', errorLog);
  
  // Store in localStorage for debugging (optional)
  try {
    const errorHistory = JSON.parse(localStorage.getItem('ai_error_history') || '[]');
    errorHistory.push(errorLog);
    // Keep only last 10 errors
    if (errorHistory.length > 10) {
      errorHistory.shift();
    }
    localStorage.setItem('ai_error_history', JSON.stringify(errorHistory));
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Parse the error for user-friendly message
  let errorMessage = "Unable to get a response from the AI.";
  let errorType: 'network' | 'rate_limit' | 'quota' | 'auth' | 'unknown' = 'unknown';
  let canRetry = false;
  
  if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
    errorMessage = "⚠️ The AI service is currently overloaded. This usually resolves quickly.\n\n**What you can do:**\n• Wait 30 seconds and try again\n• Use simpler queries\n• Consider upgrading your API tier for better reliability";
    errorType = 'network';
    canRetry = true;
  } else if (lastError.message?.includes('429')) {
    errorMessage = "⚠️ Rate limit exceeded. You've made too many requests.\n\n**What you can do:**\n• Wait a few minutes before trying again\n• Reduce request frequency\n• Upgrade to a paid tier for higher limits";
    errorType = 'rate_limit';
    canRetry = true;
  } else if (lastError.message?.includes('quota')) {
    errorMessage = "⚠️ Daily quota exceeded.\n\n**What you can do:**\n• Wait until tomorrow (resets at midnight PT)\n• Upgrade to a paid tier";
    errorType = 'quota';
    canRetry = false;
  } else if (lastError.message?.includes('API key') || lastError.message?.includes('401') || lastError.message?.includes('403')) {
    errorMessage = "⚠️ Authentication error. Please check your API key.\n\n**What you can do:**\n• Verify your VITE_GEMINI_API_KEY is set correctly\n• Check that your API key is valid and has proper permissions\n• Get a new API key from: https://makersuite.google.com/app/apikey";
    errorType = 'auth';
    canRetry = false;
  } else if (lastError.message?.includes('network') || lastError.message?.includes('fetch')) {
    errorMessage = "⚠️ Network error. Please check your internet connection.\n\n**What you can do:**\n• Check your internet connection\n• Try again in a few moments\n• If the problem persists, check your firewall settings";
    errorType = 'network';
    canRetry = true;
  }

  return { 
    text: `${errorMessage}\n\n_Technical details: ${lastError.message}_`,
    error: {
      type: errorType,
      message: lastError.message,
      canRetry,
      timestamp: new Date().toISOString(),
    }
  };
};
