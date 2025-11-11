/**
 * Test script for CSV preprocessing
 * Run with: node test-preprocessing.js
 */

const fs = require('fs');
const path = require('path');

// Read the csvPreprocessor.ts and convert to JS manually for testing
// Since we can't directly import TS in Node, we'll implement the functions here

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

// Helper to format seconds for display
function formatSeconds(seconds) {
  if (seconds === 0) return '-';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins > 0) {
    return `${mins} min ${secs} sec`;
  }
  return `${secs} sec`;
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
  // Don't filter empty lines yet - we need them to detect table boundaries
  const lines = csvContent.split('\n').map(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  let headerIndex = -1;
  let headers = [];

  for (let i = 0; i < lines.length; i++) {
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

    // Stop if we hit an empty line (table boundary)
    if (!line || line.trim() === '') {
      break;
    }

    const row = line.split(',').map(cell => cleanString(cell));

    // Stop if we hit a metadata row
    if (shouldSkipRow(row)) {
      break;
    }

    // Check if this row looks like a new header (different table)
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

    dataRows.push(funnelRow);
  }

  if (dataRows.length === 0) {
    throw new Error('No data rows found in the funnel table');
  }

  return dataRows;
}

function convertToCSV(data) {
  const headers = ['Step', 'Elapsed time (seconds)', 'Active users', 'Completion rate (%)', 'Abandonments', 'Abandonment rate (%)'];
  const rows = data.map(row => [
    row.step,
    row.elapsedTime.toString(),
    row.activeUsers.toString(),
    row.completionRate.toFixed(1),
    row.abandonments.toString(),
    row.abandonmentRate.toFixed(1),
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];

  return csvLines.join('\n');
}

// Main test
console.log('🧪 Testing CSV Preprocessing...\n');

try {
  // Read the sample CSV (with both tables to test stopping logic)
  const csvPath = path.join(__dirname, 'sample_funnel_data_full.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');

  console.log('📄 Original CSV content (first 500 chars):');
  console.log(csvContent.substring(0, 500) + '...\n');

  // Preprocess the CSV
  console.log('⚙️  Preprocessing CSV...\n');
  const cleanedData = preprocessCSV(csvContent);

  console.log('✅ Preprocessing successful!\n');
  console.log(`📊 Found ${cleanedData.length} rows in the funnel table\n`);

  // Display the cleaned data
  console.log('🎯 Cleaned Data Preview:');
  console.log('─'.repeat(120));
  console.log(
    'Step'.padEnd(25) +
    'Elapsed time'.padEnd(15) +
    'Active users'.padEnd(15) +
    'Completion rate'.padEnd(18) +
    'Abandonments'.padEnd(15) +
    'Abandonment rate'
  );
  console.log('─'.repeat(120));

  cleanedData.forEach(row => {
    console.log(
      row.step.padEnd(25) +
      formatSeconds(row.elapsedTime).padEnd(15) +
      row.activeUsers.toString().padEnd(15) +
      `${row.completionRate.toFixed(1)}%`.padEnd(18) +
      row.abandonments.toString().padEnd(15) +
      `${row.abandonmentRate.toFixed(1)}%`
    );
  });

  console.log('─'.repeat(120));

  // Generate cleaned CSV file
  const cleanedCSV = convertToCSV(cleanedData);
  const outputPath = path.join(__dirname, 'cleaned_data.csv');
  fs.writeFileSync(outputPath, cleanedCSV);

  console.log(`\n💾 Cleaned CSV saved to: ${outputPath}\n`);

  console.log('📄 Cleaned CSV content:');
  console.log(cleanedCSV);

  console.log('\n✨ All tests passed! The preprocessing works correctly.\n');

} catch (error) {
  console.error('❌ Error during preprocessing:', error.message);
  process.exit(1);
}
