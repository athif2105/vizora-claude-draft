import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: (string | number | boolean)[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    unique?: number;
    nullCount?: number;
  };
}

export interface Dataset {
  name: string;
  rows: number;
  columns: DataColumn[];
  data: Record<string, unknown>[];
}

// Date patterns to detect
const datePatterns = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
  /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YY or M/D/YYYY
  /^\w{3}\s\d{1,2},?\s\d{4}$/, // Jan 1, 2024 or Jan 1 2024
  /^\d{1,2}\s\w{3}\s\d{4}$/, // 1 Jan 2024
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
  /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/, // YYYY-MM-DD HH:MM:SS
];

// Scientific notation pattern (e.g., 1.17E+10, 2.5e-3)
const scientificNotationPattern = /^-?\d+\.?\d*[eE][+-]?\d+$/;

// Check if value is scientific notation and convert to full number
function handleScientificNotation(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();

  // Check if it's scientific notation
  if (scientificNotationPattern.test(strValue)) {
    const num = parseFloat(strValue);
    return isNaN(num) ? null : num;
  }

  return null;
}

// Detect the type of a value
function detectValueType(value: unknown): 'string' | 'number' | 'date' | 'boolean' | 'null' {
  if (value === null || value === undefined || value === '') {
    return 'null';
  }

  const strValue = String(value).trim();

  // Check for boolean
  if (strValue.toLowerCase() === 'true' || strValue.toLowerCase() === 'false') {
    return 'boolean';
  }

  // Check for scientific notation first (e.g., 1.17E+10)
  if (scientificNotationPattern.test(strValue)) {
    return 'number';
  }

  // Check for number (including negative, decimals, with commas)
  const cleanedNumber = strValue.replace(/,/g, '');
  if (!isNaN(Number(cleanedNumber)) && cleanedNumber !== '' && /^-?\d*\.?\d+$/.test(cleanedNumber)) {
    return 'number';
  }

  // Check for date patterns
  for (const pattern of datePatterns) {
    if (pattern.test(strValue)) {
      return 'date';
    }
  }

  // Check if it's a valid date using Date.parse (more flexible)
  const parsed = Date.parse(strValue);
  if (!isNaN(parsed) && strValue.length > 6) {
    // Additional check to avoid interpreting numbers as dates
    if (!/^\d+$/.test(strValue) && !/^-?\d*\.?\d+$/.test(strValue)) {
      return 'date';
    }
  }

  return 'string';
}

// Determine the dominant type for a column based on sample values
function determineColumnType(values: unknown[]): 'string' | 'number' | 'date' | 'boolean' {
  const typeCounts: Record<string, number> = {
    string: 0,
    number: 0,
    date: 0,
    boolean: 0,
  };

  // Sample up to 100 non-null values for type detection
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  // If all values are null/empty, default to string
  if (nonNullValues.length === 0) {
    return 'string';
  }

  const sampleSize = Math.min(nonNullValues.length, 100);
  const sampleValues = nonNullValues.slice(0, sampleSize);

  for (const value of sampleValues) {
    const type = detectValueType(value);
    if (type !== 'null') {
      typeCounts[type]++;
    }
  }

  // Find the most common type
  let maxCount = 0;
  let dominantType: 'string' | 'number' | 'date' | 'boolean' = 'string';

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type as 'string' | 'number' | 'date' | 'boolean';
    }
  }

  // If more than 60% of non-null values are of a specific type, use that type
  // Lowered threshold to be more flexible
  if (sampleSize > 0 && maxCount / sampleSize >= 0.6) {
    return dominantType;
  }

  // Default to string if no clear majority
  return 'string';
}

// Parse value based on detected type
function parseValue(value: unknown, type: 'string' | 'number' | 'date' | 'boolean'): string | number | boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();

  switch (type) {
    case 'number':
      // Handle scientific notation
      const scientificResult = handleScientificNotation(strValue);
      if (scientificResult !== null) {
        return scientificResult;
      }
      // Remove commas and parse
      const cleanedNumber = strValue.replace(/,/g, '');
      const num = Number(cleanedNumber);
      return isNaN(num) ? null : num;
    case 'boolean':
      return strValue.toLowerCase() === 'true';
    case 'date':
      // Keep as string for now, but formatted consistently
      return strValue;
    default:
      return strValue;
  }
}

// Calculate statistics for a column
function calculateStats(
  values: (string | number | boolean | null)[],
  type: 'string' | 'number' | 'date' | 'boolean'
): DataColumn['stats'] {
  const nullCount = values.filter(v => v === null).length;
  const nonNullValues = values.filter(v => v !== null);

  if (type === 'number') {
    const numbers = nonNullValues.filter(v => typeof v === 'number') as number[];
    if (numbers.length === 0) {
      return { unique: 0, nullCount };
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      mean: Math.round((sum / numbers.length) * 100) / 100,
      unique: new Set(numbers).size,
      nullCount,
    };
  }

  return {
    unique: new Set(nonNullValues).size,
    nullCount,
  };
}

// Get sample values for a column (including handling empty columns)
function getSampleValues(
  values: (string | number | boolean | null)[],
  count: number = 5
): (string | number | boolean)[] {
  const nonNullValues = values.filter(v => v !== null) as (string | number | boolean)[];
  const uniqueValues = [...new Set(nonNullValues)];
  return uniqueValues.slice(0, count);
}

// Process raw data into a structured dataset
function processRawData(
  rawData: Record<string, unknown>[],
  fileName: string
): Dataset {
  if (rawData.length === 0) {
    return {
      name: fileName,
      rows: 0,
      columns: [],
      data: [],
    };
  }

  // Get column names from the first row
  const columnNames = Object.keys(rawData[0]);

  // Detect types and process each column
  const columns: DataColumn[] = columnNames.map(name => {
    // Get all values for this column
    const values = rawData.map(row => row[name]);

    // Determine the column type
    const type = determineColumnType(values);

    // Parse values according to detected type
    const parsedValues = values.map(v => parseValue(v, type));

    // Calculate statistics
    const stats = calculateStats(parsedValues, type);

    // Get sample values (can be empty for columns with all nulls)
    const sampleValues = getSampleValues(parsedValues);

    return {
      name,
      type,
      sampleValues,
      stats,
    };
  });

  // Parse all data with correct types
  const processedData = rawData.map(row => {
    const processedRow: Record<string, unknown> = {};
    for (const col of columns) {
      processedRow[col.name] = parseValue(row[col.name], col.type);
    }
    return processedRow;
  });

  return {
    name: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
    rows: rawData.length,
    columns,
    data: processedData,
  };
}

// Parse CSV file
export function parseCSV(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // We'll handle type conversion ourselves
      complete: (results) => {
        try {
          const dataset = processRawData(results.data as Record<string, unknown>[], file.name);
          resolve(dataset);
        } catch (error) {
          reject(new Error(`Failed to process CSV: ${error}`));
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

// Parse Excel file
export function parseExcel(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with headers, keeping raw values
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,  // Use null for empty cells
          raw: false,    // Get formatted strings to preserve scientific notation properly
        }) as Record<string, unknown>[];

        const dataset = processRawData(jsonData, file.name);
        resolve(dataset);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// Main import function that handles both CSV and Excel
export async function importFile(file: File): Promise<Dataset> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please use CSV or Excel files.');
  }
}

// Validate imported data - now more lenient, allows empty columns
export function validateDataset(dataset: Dataset): { valid: boolean; warnings: string[]; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (dataset.rows === 0) {
    errors.push('The file appears to be empty.');
  }

  if (dataset.columns.length === 0) {
    errors.push('No columns detected in the file.');
  }

  // Just warn about columns with all null values, don't reject
  for (const col of dataset.columns) {
    if (col.sampleValues.length === 0) {
      warnings.push(`Column "${col.name}" has no values (all empty).`);
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
