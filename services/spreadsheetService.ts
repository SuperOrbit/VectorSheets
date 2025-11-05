import type { SpreadsheetRow } from '../types';

export declare function evaluateFormula(formula: string, data: SpreadsheetRow[]): any;
export declare function generatePivotTable(data: SpreadsheetRow[], options: any): any;

export class SpreadsheetService {
  static addRow(data: SpreadsheetRow[], newRow: SpreadsheetRow): SpreadsheetRow[] {
    return [...data, newRow];
  }

  static deleteRow(data: SpreadsheetRow[], rowIndex: number): SpreadsheetRow[] {
    return data.filter((_, idx) => idx !== rowIndex);
  }

  static deleteRows(data: SpreadsheetRow[], rowIndices: number[]): SpreadsheetRow[] {
    return data.filter((_, idx) => !rowIndices.includes(idx));
  }

  static addColumn(
    data: SpreadsheetRow[],
    columnName: string,
    defaultValue: any = ''
  ): SpreadsheetRow[] {
    return data.map(row => ({
      ...row,
      [columnName]: defaultValue,
    }));
  }

  static deleteColumn(data: SpreadsheetRow[], columnName: string): SpreadsheetRow[] {
    return data.map(row => {
      const { [columnName]: _, ...rest } = row as any;
      return rest as SpreadsheetRow;
    });
  }

  static deleteColumns(data: SpreadsheetRow[], columnNames: string[]): SpreadsheetRow[] {
    return data.map(row => {
      const newRow = { ...row };
      columnNames.forEach(colName => {
        delete (newRow as any)[colName];
      });
      return newRow;
    });
  }

  static updateCell(
    data: SpreadsheetRow[],
    rowIndex: number,
    columnName: string,
    value: any
  ): SpreadsheetRow[] {
    const newData = [...data];
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [columnName]: value };
    }
    return newData;
  }

  static batchUpdate(
    data: SpreadsheetRow[],
    updates: Array<{ rowIndex: number; column: string; value: any }>
  ): SpreadsheetRow[] {
    const newData = [...data];
    updates.forEach(({ rowIndex, column, value }) => {
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      }
    });
    return newData;
  }

  static sortData(
    data: SpreadsheetRow[],
    column: string,
    order: 'asc' | 'desc' = 'asc'
  ): SpreadsheetRow[] {
    const sorted = [...data].sort((a, b) => {
      const valA = a[column];
      const valB = b[column];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return order === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }

  static filterData(
    data: SpreadsheetRow[],
    column: string,
    value: string
  ): SpreadsheetRow[] {
    return data.filter(row =>
      String(row[column]).toLowerCase().includes(value.toLowerCase())
    );
  }

  static findTopN(
    data: SpreadsheetRow[],
    column: string,
    n: number = 5
  ): SpreadsheetRow[] {
    const sorted = this.sortData(data, column, 'desc');
    return sorted.slice(0, n);
  }

  static getStatistics(data: SpreadsheetRow[], column: string) {
    const values = data
      .map(row => Number(row[column]) || 0)
      .filter(v => v !== 0);

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count: values.length, sum, avg, min, max };
  }

  static exportCSV(data: SpreadsheetRow[], filename: string = 'export.csv'): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importCSV(csv: string): SpreadsheetRow[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data: SpreadsheetRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};

      headers.forEach((header, idx) => {
        const value = values[idx];
        row[header] = isNaN(Number(value)) ? value : Number(value);
      });

      data.push(row);
    }

    return data;
  }

  static generateSummary(data: SpreadsheetRow[]): string {
    if (data.length === 0) return 'No data';

    const rows = data.length;
    const columns = data.length > 0 ? Object.keys(data[0]).length : 0;

    return `Spreadsheet: ${rows} rows, ${columns} columns`;
  }
}
