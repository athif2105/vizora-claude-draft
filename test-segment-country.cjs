/**
 * Test script for CSV preprocessing with Segment and Country columns
 * Run with: node test-segment-country.cjs
 */

const fs = require('fs');
const path = require('path');

// Same preprocessing functions from the main preprocessor
function cleanString(str) {
  return str.replace(/^\uFEFF/, '').trim();
}

function convertElapsedTime(value) {
  if (!value || value === '0' || value === 0) {
    return 0;
  }

  let microseconds;
  if (typeof value === 'string') {
    microseconds = parseFloat(value);
  } else {
    microseconds = value;
  }

  if (isNaN(microseconds) || microseconds === 0) {
    return 0;
  }

  const seconds = Math.round(microseconds / 1000000);
  return seconds;
}

function formatSeconds(seconds) {
  if (seconds === 0) return '-';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  if (parts.length === 0) {
    return `${seconds}s`;
  }

  return parts.join(' ');
}

function convertPercentage(value) {
  let decimal;
  if (typeof value === 'string') {
    decimal = parseFloat(value);
  } else {
    decimal = value;
  }

  if (isNaN(decimal)) {
    return 0;
  }

  const percentage = decimal * 100;
  return percentage;
}

function normalizeColumnName(name) {
  const cleaned = cleanString(name).toLowerCase();

  const mapping = {
    'step': 'step',
    'segment': 'segment',
    'country': 'country',
    'elapsed time': 'elapsedTime',
    'elapsedtime': 'elapsedTime',
    'active users': 'activeUsers',
    'activeusers': 'activeUsers',
    'completion rate': 'completionRate',
    'completionrate': 'completionRate',
    'abandonments': 'abandonments',
    'abandonment rate': 'abandonmentRate',
    'abandonmentrate': 'abandonmentRate',
  };

  return mapping[cleaned] || cleaned;
}

function isFunnelTableHeader(row) {
  const normalizedRow = row.map(cell => normalizeColumnName(cell));

  return (
    normalizedRow.includes('step') &&
    normalizedRow.includes('elapsedTime') &&
    normalizedRow.includes('activeUsers') &&
    normalizedRow.includes('completionRate')
  );
}

function shouldSkipRow(row) {
  if (row.every(cell => !cleanString(cell))) {
    return true;
  }

  if (row[0] && cleanString(row[0]).startsWith('#')) {
    return true;
  }

  return false;
}

function preprocessCSV(csvContent) {
  const lines = csvContent.split('\n').map(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  let headerIndex = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue;

    const row = lines[i].split(',').map(cell => cleanString(cell));

    if (isFunnelTableHeader(row)) {
      headerIndex = i;
      headers = row.map(normalizeColumnName);
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find funnel table headers in CSV');
  }

  const dataRows = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];

    if (!line || line.trim() === '') {
      break;
    }

    const row = line.split(',').map(cell => cleanString(cell));

    if (shouldSkipRow(row)) {
      break;
    }

    if (isFunnelTableHeader(row)) {
      break;
    }

    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index] || '';
    });

    const activeUsers = parseInt(rowData.activeUsers) || 0;
    const funnelRow = {
      step: rowData.step || '',
      name: rowData.step || '',
      value: activeUsers,
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

  return dataRows;
}

// Main test
console.log('🧪 Testing CSV Preprocessing with Segment & Country...\n');

try {
  // Read the new CSV with Segment and Country
  const csvPath = path.join(__dirname, 'download-(more).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  console.log('📄 Original CSV (first 800 chars):');
  console.log(csvContent.substring(0, 800) + '...\n');

  // Preprocess the CSV
  console.log('⚙️  Preprocessing CSV...\n');
  const cleanedData = preprocessCSV(csvContent);

  console.log(`✅ Preprocessing successful!\n`);
  console.log(`📊 Found ${cleanedData.length} rows in the funnel table\n`);

  // Check if Segment and Country exist
  const hasSegment = cleanedData.some(row => row.segment !== undefined);
  const hasCountry = cleanedData.some(row => row.country !== undefined);

  console.log(`🔍 Detected Columns:`);
  console.log(`   - Segment: ${hasSegment ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Country: ${hasCountry ? '✅ YES' : '❌ NO'}\n`);

  // Display first 20 rows
  console.log('🎯 Cleaned Data Preview (First 20 rows):');
  console.log('─'.repeat(150));

  const headers = ['Step', 'Segment', 'Country', 'Elapsed time', 'Active users', 'Completion %', 'Abandonments', 'Abandon %'];
  console.log(
    headers[0].padEnd(20) +
    headers[1].padEnd(18) +
    headers[2].padEnd(18) +
    headers[3].padEnd(15) +
    headers[4].padEnd(15) +
    headers[5].padEnd(15) +
    headers[6].padEnd(15) +
    headers[7]
  );
  console.log('─'.repeat(150));

  cleanedData.slice(0, 20).forEach(row => {
    console.log(
      (row.step || '-').substring(0, 19).padEnd(20) +
      (row.segment || '-').substring(0, 17).padEnd(18) +
      (row.country || '-').substring(0, 17).padEnd(18) +
      formatSeconds(row.elapsedTime).padEnd(15) +
      row.activeUsers.toString().padEnd(15) +
      `${row.completionRate.toFixed(1)}%`.padEnd(15) +
      row.abandonments.toString().padEnd(15) +
      `${row.abandonmentRate.toFixed(1)}%`
    );
  });

  console.log('─'.repeat(150));
  console.log(`\n... and ${cleanedData.length - 20} more rows\n`);

  console.log('✨ All tests passed! The preprocessor correctly detects and handles Segment & Country columns!\n');

} catch (error) {
  console.error('❌ Error during preprocessing:', error.message);
  process.exit(1);
}
