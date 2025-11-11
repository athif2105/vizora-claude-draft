/**
 * CSV Preprocessing Utility for Vizora Funnel Data
 *
 * This utility cleans and formats uploaded CSV files by:
 * 1. Skipping metadata rows (rows starting with #)
 * 2. Finding and extracting only the first funnel table
 * 3. Cleaning column names (removing BOM, trimming whitespace)
 * 4. Converting elapsed time from microseconds to human-readable format
 * 5. Converting decimal rates to percentages
 */

interface FunnelRow {
  step: string;
  name: string;  // Alias for step (for compatibility)
  value: number;  // Active users count (for compatibility)
  segment?: string;  // Optional - only if present in CSV
  country?: string;  // Optional - only if present in CSV
  elapsedTime: number;  // In seconds
  activeUsers: number;
  completionRate: number;  // As decimal (0-100)
  abandonments: number;
  abandonmentRate: number;  // As decimal (0-100)
}

/**
 * Removes BOM (Byte Order Mark) and trims whitespace from a string
 */
function cleanString(str: string): string {
  return str.replace(/^\uFEFF/, '').trim();
}

/**
 * Parses a CSV line handling quoted fields properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Check if it's an escaped quote (two quotes in a row)
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(cleanString(current));
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(cleanString(current));

  return result;
}

/**
 * Converts elapsed time from various formats to seconds
 * Handles:
 * - Microseconds: 16674931278.917809 → 21003 seconds (5h 50m)
 * - Scientific notation: 1.56888E+11 → 156888 seconds (1d 19h 34m)
 * - Formatted strings: "4h 53m" → 17580 seconds
 * - Formatted strings: "2m" → 120 seconds
 * - Formatted strings: "1d 5h 30m" → 105000 seconds
 */
function convertElapsedTime(value: string | number): number {
  // Handle empty or zero values
  if (!value || value === '0' || value === 0 || value === '-') {
    return 0;
  }

  // If it's a formatted string like "4h 53m" or "2m"
  if (typeof value === 'string' && /[dhms]/.test(value)) {
    let totalSeconds = 0;

    // Extract days
    const daysMatch = value.match(/(\d+)d/);
    if (daysMatch) totalSeconds += parseInt(daysMatch[1]) * 86400;

    // Extract hours
    const hoursMatch = value.match(/(\d+)h/);
    if (hoursMatch) totalSeconds += parseInt(hoursMatch[1]) * 3600;

    // Extract minutes
    const minutesMatch = value.match(/(\d+)m/);
    if (minutesMatch) totalSeconds += parseInt(minutesMatch[1]) * 60;

    // Extract seconds
    const secondsMatch = value.match(/(\d+)s/);
    if (secondsMatch) totalSeconds += parseInt(secondsMatch[1]);

    return totalSeconds;
  }

  // Otherwise, treat it as microseconds (original format)
  let microseconds: number;
  if (typeof value === 'string') {
    microseconds = parseFloat(value);
  } else {
    microseconds = value;
  }

  // Check if conversion failed
  if (isNaN(microseconds) || microseconds === 0) {
    return 0;
  }

  // Convert microseconds to seconds and round
  const seconds = Math.round(microseconds / 1000000);

  return seconds;
}

/**
 * Converts percentage from various formats to percentage number
 * Handles:
 * - Decimal format: 0.2520138089758343 → 25.2
 * - Decimal format: 0.747986 → 74.8
 * - Percentage string: "25.2%" → 25.2
 * - Percentage string: "74.8%" → 74.8
 */
function convertPercentage(value: string | number): number {
  // Handle empty or invalid values
  if (!value && value !== 0) {
    return 0;
  }

  // If it's already a percentage string like "25.2%" or "74.8%"
  if (typeof value === 'string' && value.includes('%')) {
    const numStr = value.replace('%', '').trim();
    const percentage = parseFloat(numStr);
    return isNaN(percentage) ? 0 : percentage;
  }

  // Otherwise, treat it as a decimal
  let decimal: number;
  if (typeof value === 'string') {
    decimal = parseFloat(value);
  } else {
    decimal = value;
  }

  if (isNaN(decimal)) {
    return 0;
  }

  // If the value is already in percentage range (0-100), return as-is
  // If it's a decimal (0-1), convert to percentage
  if (decimal > 1) {
    return decimal;
  } else {
    return decimal * 100;
  }
}

/**
 * Normalizes column names to standard format
 */
function normalizeColumnName(name: string): string {
  const cleaned = cleanString(name).toLowerCase();

  // Map variations to standard names
  const mapping: { [key: string]: string } = {
    'step': 'step',
    'segment': 'segment',
    'country': 'country',
    'elapsed time': 'elapsedTime',
    'elapsedtime': 'elapsedTime',
    'active users': 'activeUsers',
    'activeusers': 'activeUsers',
    'active users (% of step 1)': 'activeUsers',  // Support exported format
    'completion rate': 'completionRate',
    'completionrate': 'completionRate',
    'abandonments': 'abandonments',
    'abandonment rate': 'abandonmentRate',
    'abandonmentrate': 'abandonmentRate',
  };

  return mapping[cleaned] || cleaned;
}

/**
 * Checks if a row is the header row for the funnel table
 */
function isFunnelTableHeader(row: string[]): boolean {
  const normalizedRow = row.map(cell => normalizeColumnName(cell));

  // Check if it contains the expected funnel table columns
  return (
    normalizedRow.includes('step') &&
    normalizedRow.includes('elapsedTime') &&
    normalizedRow.includes('activeUsers') &&
    normalizedRow.includes('completionRate')
  );
}

/**
 * Checks if a row is empty or should be skipped
 */
function shouldSkipRow(row: string[]): boolean {
  // Skip if all cells are empty
  if (row.every(cell => !cleanString(cell))) {
    return true;
  }

  // Skip metadata rows (starting with #)
  if (row[0] && cleanString(row[0]).startsWith('#')) {
    return true;
  }

  return false;
}

/**
 * Extract funnel name from line 3 of CSV
 * Format: "# Wallet Top-Up-Funnel exploration 1" -> "Wallet Top-Up"
 */
function extractFunnelName(lines: string[]): string | null {
  // Check if line 3 exists (index 2)
  if (lines.length < 3) return null;

  const line3 = lines[2].trim();

  // Check if it starts with #
  if (!line3.startsWith('#')) return null;

  // Remove # and trim
  let name = line3.replace(/^#\s*/, '').trim();

  // Extract only the part before "-Funnel" or "-funnel"
  const funnelMatch = name.match(/^(.+?)-[Ff]unnel/);
  if (funnelMatch) {
    name = funnelMatch[1].trim();
  }

  return name || null;
}

/**
 * Main preprocessing function for CSV content
 * Returns both the processed data and the extracted funnel name
 */
export function preprocessCSV(csvContent: string): { data: FunnelRow[]; funnelName: string | null } {
  // Don't filter empty lines yet - we need them to detect table boundaries
  const lines = csvContent.split('\n').map(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Extract funnel name from line 3
  const funnelName = extractFunnelName(lines);

  // Find the header row
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);

    if (isFunnelTableHeader(row)) {
      headerIndex = i;
      headers = row.map(normalizeColumnName);
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find funnel table headers in CSV');
  }

  // Extract data rows from the first table only
  const dataRows: FunnelRow[] = [];
  let lastStepName = '';  // Keep track of the last non-empty step name

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    // Stop if we hit an empty line (table boundary)
    if (!line || line.trim() === '') {
      break;
    }

    const row = parseCSVLine(line);

    // Stop if we hit a metadata row
    if (shouldSkipRow(row)) {
      break;
    }

    // Check if this row looks like a new header (different table)
    if (isFunnelTableHeader(row)) {
      break;
    }

    // Build the data object
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });

    // If step name is empty, use the last step name (for grouped rows)
    if (!rowData.step || rowData.step.trim() === '') {
      rowData.step = lastStepName;
    } else {
      // Update the last step name
      lastStepName = rowData.step;
    }

    // Skip if we still don't have a step name
    if (!rowData.step || rowData.step.trim() === '') {
      continue;
    }

    // Transform the data
    const activeUsers = parseInt(rowData.activeUsers) || 0;
    const funnelRow: FunnelRow = {
      step: rowData.step || '',
      name: rowData.step || '',  // Alias for compatibility
      value: activeUsers,  // Alias for compatibility
      elapsedTime: convertElapsedTime(rowData.elapsedTime),
      activeUsers: activeUsers,
      completionRate: convertPercentage(rowData.completionRate),
      abandonments: parseInt(rowData.abandonments) || 0,
      abandonmentRate: convertPercentage(rowData.abandonmentRate),
    };

    // Add optional fields if they exist
    if (rowData.segment !== undefined && rowData.segment !== '') {
      funnelRow.segment = rowData.segment;
    }
    if (rowData.country !== undefined && rowData.country !== '') {
      funnelRow.country = rowData.country;
    }

    dataRows.push(funnelRow);
  }

  if (dataRows.length === 0) {
    throw new Error('No data rows found in the funnel table');
  }

  return { data: dataRows, funnelName };
}

/**
 * Converts processed data back to CSV format for download
 */
export function convertToCSV(data: FunnelRow[]): string {
  const headers = ['Step', 'Elapsed time', 'Active users', 'Completion rate', 'Abandonments', 'Abandonment rate'];
  const rows = data.map(row => [
    row.step,
    row.elapsedTime,
    row.activeUsers.toString(),
    row.completionRate,
    row.abandonments.toString(),
    row.abandonmentRate,
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];

  return csvLines.join('\n');
}
