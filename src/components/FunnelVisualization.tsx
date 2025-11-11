import React, { useRef } from 'react';
import { Download, Image } from 'lucide-react';

interface FunnelStep {
  name: string;
  value: number;
  segment?: string;
  country?: string;
  completionRate: number;
  abandonmentRate: number;
  elapsedTime: number;
  activeUsers: number;
  abandonments: number;
}

interface FunnelVisualizationProps {
  data: FunnelStep[];
  hasData: boolean;
  importedFileName?: string;
}

const FunnelVisualization: React.FC<FunnelVisualizationProps> = ({ data, hasData, importedFileName }) => {
  const funnelChartRef = useRef<HTMLDivElement>(null);
  const funnelContentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!funnelChartRef.current) {
      console.error('Funnel chart ref is null');
      alert('Failed to export PNG. Please try again.');
      return;
    }

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      // Capture the outer container (includes padding and background)
      const element = funnelChartRef.current;

      // Double check element still exists
      if (!element) {
        console.error('Element is null');
        alert('Failed to export PNG. Please try again.');
        return;
      }

      // Wait for render to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        backgroundColor: '#f9fafb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-funnel-chart]') as HTMLElement;
          if (clonedElement) {
            // Remove overflow and transitions in the cloned element
            clonedElement.style.overflow = 'visible';
            clonedElement.style.maxWidth = 'none';
            clonedElement.style.width = 'auto';
            // Remove all transitions to avoid animation issues
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: any) => {
              if (el.style) {
                el.style.transition = 'none';
                el.style.animation = 'none';
              }
            });
          }
        }
      });

      // Verify canvas was created successfully
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas creation failed or has zero dimensions');
        alert('Failed to export PNG. Please try again.');
        return;
      }

      // Convert to PNG and download
      const link = document.createElement('a');
      const baseFileName = importedFileName ? importedFileName.replace(/\.csv$/i, '') : 'funnel-visualization';
      link.download = `${baseFileName}-vizora.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Clean up
      link.remove();
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
  };

  const handleDownloadCSV = () => {
    // Build CSV content with exact formatting from the detailed breakdown table
    const hasSegment = data.some(s => s.segment);
    const hasCountry = data.some(s => s.country);

    // Build header row
    const headers = ['Step'];
    if (hasSegment) headers.push('Segment');
    if (hasCountry) headers.push('Country');
    headers.push('Elapsed time', 'Active users', 'Completion rate', 'Abandonments', 'Abandonment rate');

    // Build data rows with grouping logic (same as the table display)
    const rows = data.map((step, index) => {
      // Helper functions for grouping (same as table)
      const shouldShowStep = index === 0 || data[index].name !== data[index - 1].name;
      const shouldShowSegment = index === 0 ||
        data[index].name !== data[index - 1].name ||
        data[index].segment !== data[index - 1].segment;

      const row = [shouldShowStep ? step.name : ''];
      if (hasSegment) row.push(shouldShowSegment ? (step.segment || '-') : '');
      if (hasCountry) row.push(step.country || '-');

      // Export in nice formatted version
      row.push(
        formatElapsedTime(step.elapsedTime),
        step.activeUsers.toString(),
        `${step.completionRate.toFixed(1)}%`,
        step.abandonments.toString(),
        `${step.abandonmentRate.toFixed(1)}%`
      );
      return row;
    });

    // Combine headers and rows
    // Only quote cells that contain commas, quotes, or newlines
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => {
        const cellStr = String(cell);
        // Quote if contains comma, quote, newline, or is empty after a non-empty cell
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename: remove .csv extension from imported name, add vizora, then .csv
    const baseFileName = importedFileName ? importedFileName.replace(/\.csv$/i, '') : 'funnel-data';
    const fileName = `${baseFileName}-vizora.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-5xl mb-4 text-gray-400 dark:text-gray-400">+</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Import data to view your funnels</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Upload your funnel data to get started</p>
        </div>
      </div>
    );
  }

  // Group data by unique step names and extract "Total" rows for funnel visualization
  const groupedSteps: FunnelStep[] = [];
  const seenSteps = new Set<string>();

  data.forEach((step) => {
    // Only process each unique step once
    if (!seenSteps.has(step.name)) {
      seenSteps.add(step.name);

      // Find the "Total" row for this step (where country/segment = "Total")
      // If no "Total" row exists, use the first occurrence
      const totalRow = data.find(
        s => s.name === step.name &&
        (s.country?.toLowerCase() === 'total' || s.segment?.toLowerCase() === 'total')
      );

      groupedSteps.push(totalRow || step);
    }
  });

  // Calculate percentages relative to first step
  const firstStepUsers = groupedSteps.length > 0 ? groupedSteps[0].activeUsers : 1;
  const dataWithPercentages = groupedSteps.map((step, index) => {
    return {
      ...step,
      userPercentage: (step.activeUsers / firstStepUsers) * 100,
      stepNumber: index + 1
    };
  });

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Funnel Chart */}
      <div ref={funnelChartRef} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-4 overflow-x-auto scrollbar-dark shadow-sm">
        <div className="flex items-center justify-start min-h-[280px]">
          <div ref={funnelContentRef} className="flex items-start gap-2 min-w-max pl-2">
            {dataWithPercentages.map((step, index) => {
              const maxBarHeight = 100;
              const finalBarHeight = (step.userPercentage / 100) * maxBarHeight;

              // Remove number prefix from step name (e.g., "1. App open" → "App open")
              const cleanStepName = step.name.replace(/^\d+\.\s*/, '');

              return (
                <div key={index} className="flex items-center">
                  {/* Funnel Card */}
                  <div
                    className="flex flex-col bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 p-2.5 shadow-md hover:shadow-lg transition-shadow"
                    style={{ width: '140px' }}
                  >
                    {/* Step Number and Name */}
                    <div className="mb-1.5">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                        Step {step.stepNumber}
                      </div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white break-words">
                        {cleanStepName}
                      </div>
                    </div>

                    {/* Active Users Percentage */}
                    <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {step.userPercentage.toFixed(1)}%
                    </div>

                    {/* Colored Bar Container - Fixed height */}
                    <div className="mb-2 flex items-end justify-center" style={{ height: `${maxBarHeight}px` }}>
                      <div
                        className="bg-gradient-to-b from-blue-500 to-blue-600 rounded-md transition-all duration-500"
                        style={{ height: `${finalBarHeight}px`, width: '90px' }}
                      ></div>
                    </div>

                    {/* Abandonment Rate */}
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      <div className="mb-0.5">Abandonment rate</div>
                      <div className="flex items-center gap-1">
                        <span className="text-red-500 dark:text-red-400">●</span>
                        <span className="text-gray-900 dark:text-white font-semibold">{step.abandonments.toLocaleString()}</span>
                        <span className="text-red-500 dark:text-red-400">{step.abandonmentRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow between steps */}
                  {index < dataWithPercentages.length - 1 && (
                    <div className="text-gray-400 dark:text-gray-600 text-lg mb-6">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Half - Detailed Breakdown with Scroll */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Breakdown</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPNG}
              className="flex items-center justify-center p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
              title="Export as PNG"
            >
              <Image size={16} />
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
              title="Download CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg scrollbar-dark shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Step</th>
                {data.some(s => s.segment) && <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Segment</th>}
                {data.some(s => s.country) && <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Country</th>}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Active Users</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Completion Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Abandonments</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Abandonment Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-900">Elapsed Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
              {data.map((step, index) => {
                // Helper functions for grouping
                const shouldShowStep = index === 0 || data[index].name !== data[index - 1].name;
                const shouldShowSegment = index === 0 ||
                  data[index].name !== data[index - 1].name ||
                  data[index].segment !== data[index - 1].segment;

                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {shouldShowStep ? step.name : ''}
                    </td>
                    {data.some(s => s.segment) && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {shouldShowSegment ? (step.segment || '-') : ''}
                      </td>
                    )}
                    {data.some(s => s.country) && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {step.country || '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {step.activeUsers.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {step.completionRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {step.abandonments.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {step.abandonmentRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatElapsedTime(step.elapsedTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper function to format elapsed time
const formatElapsedTime = (seconds: number): string => {
  if (seconds === 0) return '-';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && parts.length === 0) parts.push(`${secs}s`);

  // If less than a minute, show seconds
  if (parts.length === 0) {
    return `${secs}s`;
  }

  return parts.join(' ');
};

export default FunnelVisualization;
