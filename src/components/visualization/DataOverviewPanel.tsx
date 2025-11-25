import React, { useState } from 'react';
import {
  Database,
  Table2,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  TrendingUp,
  TrendingDown,
  BarChart2,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

interface DataColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  sampleValues: (string | number | boolean)[];
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    unique?: number;
  };
}

interface Dataset {
  name: string;
  rows: number;
  columns: DataColumn[];
}

interface DataOverviewPanelProps {
  collapsed: boolean;
  dataset: Dataset | null;
}

const DataOverviewPanel: React.FC<DataOverviewPanelProps> = ({ collapsed, dataset }) => {
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [datasetInfoOpen, setDatasetInfoOpen] = useState(true);
  const [columnsOpen, setColumnsOpen] = useState(true);

  // Show empty state if no dataset
  if (!dataset) {
    if (collapsed) {
      return (
        <div className="flex flex-col items-center py-4 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer">
                <FileSpreadsheet size={18} className="text-slate-400 dark:text-slate-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">No data loaded</p>
              <p className="text-xs text-slate-500">Import a file to get started</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return (
      <div className="p-4 text-center">
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 inline-block mb-3">
          <FileSpreadsheet size={24} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data loaded</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Import a file to see data overview</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <Type size={12} className="text-emerald-500" />;
      case 'number':
        return <Hash size={12} className="text-blue-500" />;
      case 'date':
        return <Calendar size={12} className="text-orange-500" />;
      case 'boolean':
        return <ToggleLeft size={12} className="text-purple-500" />;
      default:
        return <Type size={12} className="text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'string':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'number':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'date':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'boolean':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const toggleColumnExpand = (columnName: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnName)) {
        next.delete(columnName);
      } else {
        next.add(columnName);
      }
      return next;
    });
  };

  // Collapsed state - show icons only
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200/50 dark:border-blue-800/50 cursor-pointer hover:from-blue-500/20 hover:to-purple-500/20 transition-all">
              <FileSpreadsheet size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{dataset.name}</p>
            <p className="text-xs text-slate-500">{dataset.rows.toLocaleString()} rows × {dataset.columns.length} columns</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />

        {dataset.columns.slice(0, 6).map((column) => (
          <Tooltip key={column.name}>
            <TooltipTrigger asChild>
              <div className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                {getTypeIcon(column.type)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{column.name}</p>
              <p className="text-xs text-slate-500 capitalize">{column.type}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {dataset.columns.length > 6 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                +{dataset.columns.length - 6}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{dataset.columns.length - 6} more columns</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  // Expanded state
  return (
    <div className="p-3 space-y-3">
      {/* Dataset Info Card */}
      <Collapsible open={datasetInfoOpen} onOpenChange={setDatasetInfoOpen}>
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                <FileSpreadsheet size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dataset Info</span>
            </div>
            {datasetInfoOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3">
              {/* Dataset name */}
              <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Name</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{dataset.name}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Table2 size={12} className="text-blue-600 dark:text-blue-400" />
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">Rows</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{dataset.rows.toLocaleString()}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-800/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers size={12} className="text-purple-600 dark:text-purple-400" />
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wide font-medium">Columns</p>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{dataset.columns.length}</p>
                </div>
              </div>

              {/* Column type distribution */}
              <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 font-medium">Column Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {['string', 'number', 'date', 'boolean'].map(type => {
                    const count = dataset.columns.filter(c => c.type === type).length;
                    if (count === 0) return null;
                    return (
                      <Badge
                        key={type}
                        variant="outline"
                        className={`text-[10px] px-2 py-0.5 ${getTypeBadgeColor(type)}`}
                      >
                        {getTypeIcon(type)}
                        <span className="ml-1">{count} {type}</span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Columns List */}
      <Collapsible open={columnsOpen} onOpenChange={setColumnsOpen}>
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20">
                <Database size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Columns</span>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-100 dark:bg-slate-700">
                {dataset.columns.length}
              </Badge>
            </div>
            {columnsOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-2">
              {dataset.columns.map((column) => {
                const isExpanded = expandedColumns.has(column.name);

                return (
                  <div
                    key={column.name}
                    className="rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    {/* Column header */}
                    <button
                      onClick={() => toggleColumnExpand(column.name)}
                      className="w-full p-2.5 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1 rounded ${getTypeBadgeColor(column.type)}`}>
                          {getTypeIcon(column.type)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {column.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 h-4 ${getTypeBadgeColor(column.type)}`}
                        >
                          {column.type}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown size={12} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={12} className="text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Column details */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2.5 space-y-2 border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                        {/* Sample values */}
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                            Sample Values
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {column.sampleValues.slice(0, 4).map((value, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono"
                              >
                                {String(value).length > 12 ? String(value).slice(0, 12) + '...' : String(value)}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Statistics for numeric columns */}
                        {column.type === 'number' && column.stats && (
                          <div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 font-medium">
                              Statistics
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {column.stats.min !== undefined && (
                                <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-900/20 text-center">
                                  <p className="text-[9px] text-blue-600 dark:text-blue-400 uppercase">Min</p>
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {typeof column.stats.min === 'number' && column.stats.min < 1
                                      ? column.stats.min.toFixed(2)
                                      : column.stats.min?.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {column.stats.max !== undefined && (
                                <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-center">
                                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase">Max</p>
                                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    {typeof column.stats.max === 'number' && column.stats.max < 1
                                      ? column.stats.max.toFixed(2)
                                      : column.stats.max?.toLocaleString()}
                                  </p>
                                </div>
                              )}
                              {column.stats.mean !== undefined && (
                                <div className="p-1.5 rounded bg-purple-50 dark:bg-purple-900/20 text-center">
                                  <p className="text-[9px] text-purple-600 dark:text-purple-400 uppercase">Avg</p>
                                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                    {typeof column.stats.mean === 'number' && column.stats.mean < 1
                                      ? column.stats.mean.toFixed(2)
                                      : column.stats.mean?.toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Unique count for string columns */}
                        {column.type === 'string' && column.stats?.unique && (
                          <div className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-50 dark:bg-emerald-900/20">
                            <BarChart2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                              <span className="font-semibold">{column.stats.unique}</span> unique values
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};

export default DataOverviewPanel;
