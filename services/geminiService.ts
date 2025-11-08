import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from '@google/generative-ai';
import type { AIResponse, FunctionCallAction, SpreadsheetRow } from '../types';

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

const getModel = () => {
  if (!genAI) {
    throw new Error('Gemini AI is not initialized. Please set VITE_GEMINI_API_KEY.');
  }
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest", // Changed to more stable model
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
  onRetry?: (attempt: number, delay: number) => void
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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const model = getModel();
      const chat = model.startChat();
      const result = await chat.sendMessage([
        { text: `You are a data analyst assistant. Here is the current spreadsheet data in JSON format: ${JSON.stringify(sheetData)}` },
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

  // All retries failed
  console.error("All retry attempts failed:", lastError.message);
  
  // Parse the error for user-friendly message
  let errorMessage = "Unable to get a response from the AI.";
  
  if (lastError.message?.includes('503') || lastError.message?.includes('overloaded')) {
    errorMessage = "⚠️ The AI service is currently overloaded. This usually resolves quickly.\n\n**What you can do:**\n• Wait 30 seconds and try again\n• Use simpler queries\n• Consider upgrading your API tier for better reliability";
  } else if (lastError.message?.includes('429')) {
    errorMessage = "⚠️ Rate limit exceeded. You've made too many requests.\n\n**What you can do:**\n• Wait a few minutes before trying again\n• Reduce request frequency\n• Upgrade to a paid tier for higher limits";
  } else if (lastError.message?.includes('quota')) {
    errorMessage = "⚠️ Daily quota exceeded.\n\n**What you can do:**\n• Wait until tomorrow (resets at midnight PT)\n• Upgrade to a paid tier";
  }

  return { 
    text: `${errorMessage}\n\n_Technical details: ${lastError.message}_` 
  };
};
