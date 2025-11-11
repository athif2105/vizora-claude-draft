"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FunnelData {
  step: string;
  segment?: string;
  country?: string;
  activeUsers: number;
  completionRate: number;
  abandonmentRate: number;
  elapsedTime: number;
  abandonments: number;
}

interface DataTableProps {
  data: FunnelData[];
}

const DataTable = ({ data }: DataTableProps) => {
  // Format time in seconds to human-readable format
  const formatTime = (seconds: number): string => {
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

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format percentages
  const formatPercentage = (percent: number): string => {
    return `${percent.toFixed(1)}%`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="border border-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500">No data available. Import data to see breakdown.</p>
      </div>
    );
  }

  // Check if data has segment or country columns
  const hasSegment = data.some(row => row.segment !== undefined);
  const hasCountry = data.some(row => row.country !== undefined);

  // Helper function to determine if we should show the cell value or hide it for grouping
  const shouldShowStep = (index: number) => {
    if (index === 0) return true;
    return data[index].step !== data[index - 1].step;
  };

  const shouldShowSegment = (index: number) => {
    if (index === 0) return true;
    const current = data[index];
    const previous = data[index - 1];
    return current.step !== previous.step || current.segment !== previous.segment;
  };

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-900 hover:bg-gray-900">
            <TableHead className="text-gray-300">Step</TableHead>
            {hasSegment && <TableHead className="text-gray-300">Segment</TableHead>}
            {hasCountry && <TableHead className="text-gray-300">Country</TableHead>}
            <TableHead className="text-gray-300">Active Users</TableHead>
            <TableHead className="text-gray-300">Completion Rate</TableHead>
            <TableHead className="text-gray-300">Abandonment Rate</TableHead>
            <TableHead className="text-gray-300">Elapsed Time</TableHead>
            <TableHead className="text-gray-300">Abandonments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className="hover:bg-gray-900/50">
              <TableCell className="font-medium text-gray-200">
                {shouldShowStep(index) ? row.step : ''}
              </TableCell>
              {hasSegment && (
                <TableCell className="text-gray-300">
                  {shouldShowSegment(index) ? (row.segment || '-') : ''}
                </TableCell>
              )}
              {hasCountry && <TableCell className="text-gray-300">{row.country || '-'}</TableCell>}
              <TableCell className="text-gray-300">{formatNumber(row.activeUsers)}</TableCell>
              <TableCell className="text-green-400">{formatPercentage(row.completionRate)}</TableCell>
              <TableCell className="text-red-400">{formatPercentage(row.abandonmentRate)}</TableCell>
              <TableCell className="text-gray-300">{formatTime(row.elapsedTime)}</TableCell>
              <TableCell className="text-gray-300">{formatNumber(row.abandonments)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;