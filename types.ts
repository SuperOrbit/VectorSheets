export interface SpreadsheetRow {
  month: string;
  product: string;
  region: string;
  sales: number;
  cost: number;
  profit: number;
  [key: string]: string | number; // Allow dynamic columns
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  id?: string;
  feedback?: 'positive' | 'negative' | null;
  canUndo?: boolean;
  canRedo?: boolean;
}

export interface Suggestion {
  text: string;
  category: 'analysis' | 'formula' | 'filter' | 'sort' | 'chart' | 'general';
  icon?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  isActive: boolean;
}

export interface FunctionCallAction {
  name: 'sort_data' | 'calculate_aggregate' | 'filter_data' | 'add_row' | 'update_cell' | 'find_top_n' | 
         'delete_row' | 'delete_column' | 'add_column' | 'format_cells' | 'merge_cells' | 'apply_formula' |
         'duplicate_sheet' | 'rename_sheet' | 'batch_update' | 'pivot_table' | 'create_chart' | 'clear_filter' | 'generate_chart' | 'delete_rows' | 'delete_columns';
  args: any;
}

export interface ChartData {
  chartType: 'bar' | 'line' | 'pie';
  labels: string[];
  datasets: { label: string; data: number[] }[];
  title: string;
}

export interface AIResponse {
  text: string;
  action?: FunctionCallAction;
  actions?: FunctionCallAction[];
  error?: {
    type: 'network' | 'rate_limit' | 'quota' | 'auth' | 'unknown';
    message: string;
    canRetry: boolean;
    timestamp: string;
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
}

export interface CellSelection {
  startRow: number;
  startCol: string;
  endRow?: number;
  endCol?: string;
}

export interface FilterState {
  column: keyof SpreadsheetRow | null;
  value: string;
}

export interface SortState {
  column: keyof SpreadsheetRow | null;
  order: 'asc' | 'desc' | null;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  xAxis: string;
  yAxis: string;
}

export interface Sheet {
  name: string;
  data: SpreadsheetRow[];
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  actions: FunctionCallAction[];
  insights: string[];
  lastQuery: string;
}
