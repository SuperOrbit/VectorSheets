/**
 * File Import/Export utilities for Excel and Google Sheets
 */

import type { SpreadsheetRow } from '../types';

/**
 * Parse Excel file (XLSX) - simplified version
 * Note: Full XLSX parsing requires a library like xlsx or exceljs
 */
export const parseExcelFile = async (file: File): Promise<SpreadsheetRow[]> => {
  // This is a placeholder - in production, use a library like 'xlsx'
  // For now, we'll handle CSV and provide structure for XLSX
  
  if (file.name.endsWith('.csv')) {
    return parseCSVFile(file);
  }
  
  // For XLSX files, you would use a library like:
  // import * as XLSX from 'xlsx';
  // const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  // const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // return XLSX.utils.sheet_to_json(sheet);
  
  throw new Error('XLSX parsing requires the xlsx library. Please install: npm install xlsx');
};

/**
 * Parse CSV file
 */
export const parseCSVFile = async (file: File): Promise<SpreadsheetRow[]> => {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: SpreadsheetRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Try to parse as number
      const numValue = Number(value);
      row[header] = isNaN(numValue) ? value : numValue;
    });
    
    rows.push(row);
  }
  
  return rows;
};

/**
 * Export to Excel format (XLSX)
 * Note: Full XLSX export requires a library like xlsx
 */
export const exportToExcel = (data: SpreadsheetRow[], filename: string = 'export.xlsx'): void => {
  // This is a placeholder - in production, use a library like 'xlsx'
  // For now, we'll export as CSV which Excel can open
  
  exportToCSV(data, filename.replace('.xlsx', '.csv'));
  
  // For full XLSX export, you would use:
  // import * as XLSX from 'xlsx';
  // const worksheet = XLSX.utils.json_to_sheet(data);
  // const workbook = XLSX.utils.book_new();
  // XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // XLSX.writeFile(workbook, filename);
};

/**
 * Export to CSV
 */
export const exportToCSV = (data: SpreadsheetRow[], filename: string = 'export.csv'): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
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
 * Export to Google Sheets format (as CSV - Google Sheets can import CSV)
 */
export const exportToGoogleSheets = (data: SpreadsheetRow[], filename: string = 'export.csv'): void => {
  // Google Sheets can import CSV directly
  exportToCSV(data, filename);
};

/**
 * Import from Google Sheets (via CSV export or API)
 * For API integration, you would need OAuth and Google Sheets API
 */
export const importFromGoogleSheets = async (file: File): Promise<SpreadsheetRow[]> => {
  // If user exports from Google Sheets as CSV, we can import it
  if (file.name.endsWith('.csv')) {
    return parseCSVFile(file);
  }
  
  // For direct API integration:
  // 1. User authenticates with Google OAuth
  // 2. Fetch spreadsheet data via Google Sheets API
  // 3. Parse and return as SpreadsheetRow[]
  
  throw new Error('Google Sheets API integration requires OAuth setup. For now, export from Google Sheets as CSV and import that file.');
};

/**
 * Generate webhook payload for integrations
 */
export const generateWebhookPayload = (
  event: 'data_updated' | 'export' | 'prompt' | 'error',
  data: any
): string => {
  return JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  });
};

/**
 * Send webhook (for integrations)
 */
export const sendWebhook = async (url: string, payload: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });
    return response.ok;
  } catch (error) {
    console.error('Webhook error:', error);
    return false;
  }
};

