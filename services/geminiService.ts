import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type { AIResponse, FunctionCallAction, SpreadsheetRow } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY is not set. Please set it in your .env.local file.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

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

const model = genAI.getGenerativeModel({
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
            type: "object",
            properties: {
              column: {
                type: "string",
                description: "The column to sort by (e.g., 'sales', 'cost', 'profit', 'month', 'product', 'region').",
              },
              order: {
                type: "string",
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
            type: "object",
            properties: {
              column: {
                type: "string",
                description: "Column to calculate on (e.g., 'sales', 'cost', 'profit').",
              },
              operation: {
                type: "string",
                enum: ["sum", "average", "min", "max", "count"],
                description: "Type of calculation: sum, average, min, max, or count.",
              },
              filterColumn: {
                type: "string",
                description: "Optional: Column to filter by (e.g., 'region', 'product', 'month').",
              },
              filterValue: {
                type: "string",
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
            type: "object",
            properties: {
              column: {
                type: "string",
                description: "Column to filter by (e.g., 'region', 'product', 'month').",
              },
              value: {
                type: "string",
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
            type: "object",
            properties: {
              month: { type: "string", description: "Month name (e.g., 'January')" },
              product: { type: "string", description: "Product name (e.g., 'Product A')" },
              region: { type: "string", description: "Region name (e.g., 'North')" },
              sales: { type: "number", description: "Sales amount" },
              cost: { type: "number", description: "Cost amount" },
              profit: { type: "number", description: "Profit amount" },
            },
            required: ["month", "product", "region", "sales", "cost", "profit"],
          },
        },
        {
          name: "update_cell",
          description: "Updates a specific cell value in the spreadsheet by row index and column name.",
          parameters: {
            type: "object",
            properties: {
              rowIndex: {
                type: "number",
                description: "Row index (0-based) to update. First row is 0, second is 1, etc.",
              },
              column: {
                type: "string",
                description: "Column to update (e.g., 'sales', 'cost', 'profit', 'product', 'region', 'month').",
              },
              value: {
                type: "string",
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
            type: "object",
            properties: {
              column: {
                type: "string",
                description: "Column to rank by (e.g., 'sales', 'profit', 'cost').",
              },
              n: {
                type: "number",
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
            type: "object",
            properties: {
              rowIndices: {
                type: "array",
                items: {
                  type: "number",
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
            type: "object",
            properties: {
              columnNames: {
                type: "array",
                items: {
                  type: "string",
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
            type: "object",
            properties: {
              columnName: {
                type: "string",
                description: "The name of the new column.",
              },
              defaultValue: {
                type: "string",
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
            type: "object",
            properties: {
              range: {
                type: "string",
                description: "The range of cells to format (e.g., 'A1:C5').",
              },
              format: {
                type: "object",
                properties: {
                  bold: { type: "boolean" },
                  italic: { type: "boolean" },
                  underline: { type: "boolean" },
                  fontColor: { type: "string" },
                  backgroundColor: { type: "string" },
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
            type: "object",
            properties: {
              range: {
                type: "string",
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
            type: "object",
            properties: {
              cell: {
                type: "string",
                description: "The cell to apply the formula to (e.g., 'A1').",
              },
              formula: {
                type: "string",
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
            type: "object",
            properties: {
              newName: {
                type: "string",
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
            type: "object",
            properties: {
              newName: {
                type: "string",
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
            type: "object",
            properties: {
              updates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rowIndex: { type: "number" },
                    column: { type: "string" },
                    value: { type: "string" },
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
            type: "object",
            properties: {
              rows: {
                type: "array",
                items: { type: "string" },
                description: "The columns to use as rows in the pivot table.",
              },
              columns: {
                type: "array",
                items: { type: "string" },
                description: "The columns to use as columns in the pivot table.",
              },
              values: {
                type: "string",
                description: "The column to use for the values in the pivot table.",
              },
              aggregator: {
                type: "string",
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
            type: "object",
            properties: {
              chartType: {
                type: "string",
                enum: ["bar", "line", "pie"],
                description: "The type of chart to create.",
              },
              title: {
                type: "string",
                description: "The title of the chart.",
              },
              xAxis: {
                type: "string",
                description: "The column to use for the x-axis.",
              },
              yAxis: {
                type: "string",
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
            type: "object",
            properties: {},
          },
        },
        {
          name: "generate_chart",
          description: "Generates a chart from the spreadsheet data.",
          parameters: {
            type: "object",
            properties: {
              chartType: {
                type: "string",
                enum: ["bar", "line", "pie"],
                description: "The type of chart to generate.",
              },
              labels: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "The labels for the x-axis.",
              },
              datasets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: {
                      type: "string",
                      description: "The label for the dataset.",
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "number",
                      },
                      description: "The data points for the dataset.",
                    },
                  },
                  required: ["label", "data"],
                },
                description: "The datasets for the chart.",
              },
              title: {
                type: "string",
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

export const getAIResponse = async (
  userInput: string, 
  sheetData: SpreadsheetRow[],
  onRetry?: (attempt: number, delay: number) => void
): Promise<AIResponse> => {
  if (userInput.toLowerCase().includes('chart') && !userInput.toLowerCase().includes('bar') && !userInput.toLowerCase().includes('line') && !userInput.toLowerCase().includes('pie')) {
    return { text: 'What type of chart would you like to generate? (e.g., bar, line, pie)' };
  }

  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
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
