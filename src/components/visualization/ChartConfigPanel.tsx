import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Axis3D,
  Palette,
  Tag,
  ArrowUpDown,
  Calculator,
  Eye,
  EyeOff,
  Type,
  LayoutGrid,
  Settings,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

type ChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'histogram'
  | 'boxplot'
  | 'funnel'
  | 'heatmap'
  | 'treemap';

interface ChartConfig {
  xAxis: string | null;
  yAxis: string | null;
  colorDimension: string | null;
  title: string;
  showLegend: boolean;
  showLabels: boolean;
  sortOrder: 'none' | 'asc' | 'desc';
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

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

interface ChartConfigPanelProps {
  collapsed: boolean;
  config: ChartConfig;
  columns: DataColumn[];
  data?: Record<string, unknown>[];
  chartType: ChartType;
  onConfigChange: (config: Partial<ChartConfig>) => void;
}

const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
  collapsed,
  config,
  columns,
  data = [],
  chartType,
  onConfigChange
}) => {
  const [axisOpen, setAxisOpen] = useState(true);
  const [styleOpen, setStyleOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);

  // Check if a column is empty (all null/empty values)
  const isColumnEmpty = (columnName: string): boolean => {
    if (!data || data.length === 0) return false;
    return data.every(row => {
      const value = row[columnName];
      return value === null || value === undefined || value === '';
    });
  };

  const categoricalColumns = columns.filter(c => c.type === 'string');
  const numericColumns = columns.filter(c => c.type === 'number');

  // Determine which axes are relevant for this chart type
  const showXAxis = !['pie', 'donut', 'treemap', 'funnel'].includes(chartType);
  const showYAxis = !['pie', 'donut', 'treemap', 'funnel', 'heatmap'].includes(chartType);
  const showColorDimension = true;

  // Collapsed state - show icons only
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-200/50 dark:border-purple-800/50 cursor-pointer hover:from-purple-500/20 hover:to-pink-500/20 transition-all">
              <Axis3D size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Axis Configuration</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <Palette size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Style Options</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <Calculator size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Data Aggregation</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
              <Settings size={18} className="text-slate-500 dark:text-slate-400" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="font-medium">Advanced Settings</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="p-3 space-y-3">
      {/* Axis Configuration */}
      <Collapsible open={axisOpen} onOpenChange={setAxisOpen}>
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />

          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20">
                <Axis3D size={14} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Axis & Dimensions</span>
            </div>
            {axisOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-4">
              {/* Chart Title */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Type size={12} />
                  Chart Title
                </Label>
                <Input
                  value={config.title}
                  onChange={(e) => onConfigChange({ title: e.target.value })}
                  placeholder="Enter chart title..."
                  className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>

              {/* X-Axis */}
              {showXAxis && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold">X</span>
                    X-Axis (Category)
                  </Label>
                  <Select
                    value={config.xAxis || ''}
                    onValueChange={(value) => onConfigChange({ xAxis: value })}
                  >
                    <SelectTrigger className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categoricalColumns.map((col) => {
                        const isEmpty = isColumnEmpty(col.name);
                        return (
                          <SelectItem
                            key={col.name}
                            value={col.name}
                            disabled={isEmpty}
                            className={isEmpty ? 'opacity-50' : ''}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${isEmpty ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'}`}>
                                str
                              </Badge>
                              <span className={isEmpty ? 'text-slate-400 dark:text-slate-500' : ''}>
                                {col.name}
                                {isEmpty && <span className="ml-1 text-[10px] italic">(empty)</span>}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Y-Axis */}
              {showYAxis && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">Y</span>
                    Y-Axis (Value)
                  </Label>
                  <Select
                    value={config.yAxis || ''}
                    onValueChange={(value) => onConfigChange({ yAxis: value })}
                  >
                    <SelectTrigger className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map((col) => {
                        const isEmpty = isColumnEmpty(col.name);
                        return (
                          <SelectItem
                            key={col.name}
                            value={col.name}
                            disabled={isEmpty}
                            className={isEmpty ? 'opacity-50' : ''}
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 ${isEmpty ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                                num
                              </Badge>
                              <span className={isEmpty ? 'text-slate-400 dark:text-slate-500' : ''}>
                                {col.name}
                                {isEmpty && <span className="ml-1 text-[10px] italic">(empty)</span>}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Color Dimension */}
              {showColorDimension && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Palette size={12} />
                    Color Dimension
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Optional</Badge>
                  </Label>
                  <Select
                    value={config.colorDimension || 'none'}
                    onValueChange={(value) => onConfigChange({ colorDimension: value === 'none' ? null : value })}
                  >
                    <SelectTrigger className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categoricalColumns.map((col) => {
                        const isEmpty = isColumnEmpty(col.name);
                        return (
                          <SelectItem
                            key={col.name}
                            value={col.name}
                            disabled={isEmpty}
                            className={isEmpty ? 'opacity-50' : ''}
                          >
                            <span className={isEmpty ? 'text-slate-400 dark:text-slate-500' : ''}>
                              {col.name}
                              {isEmpty && <span className="ml-1 text-[10px] italic">(empty)</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Style Options */}
      <Collapsible open={styleOpen} onOpenChange={setStyleOpen}>
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20">
                <Sparkles size={14} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Style & Display</span>
            </div>
            {styleOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-4">
              {/* Show Legend */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <LayoutGrid size={14} className="text-slate-500 dark:text-slate-400" />
                  <Label htmlFor="show-legend" className="text-sm text-slate-700 dark:text-slate-300">
                    Show Legend
                  </Label>
                </div>
                <Switch
                  id="show-legend"
                  checked={config.showLegend}
                  onCheckedChange={(checked) => onConfigChange({ showLegend: checked })}
                />
              </div>

              {/* Show Labels */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-slate-500 dark:text-slate-400" />
                  <Label htmlFor="show-labels" className="text-sm text-slate-700 dark:text-slate-300">
                    Show Data Labels
                  </Label>
                </div>
                <Switch
                  id="show-labels"
                  checked={config.showLabels}
                  onCheckedChange={(checked) => onConfigChange({ showLabels: checked })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Data Aggregation */}
      <Collapsible open={dataOpen} onOpenChange={setDataOpen}>
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20">
                <Calculator size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data & Sorting</span>
            </div>
            {dataOpen ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-4">
              {/* Aggregation */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Calculator size={12} />
                  Aggregation Function
                </Label>
                <Select
                  value={config.aggregation}
                  onValueChange={(value) => onConfigChange({ aggregation: value as ChartConfig['aggregation'] })}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">SUM</span>
                        Sum of values
                      </div>
                    </SelectItem>
                    <SelectItem value="avg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">AVG</span>
                        Average
                      </div>
                    </SelectItem>
                    <SelectItem value="count">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">CNT</span>
                        Count
                      </div>
                    </SelectItem>
                    <SelectItem value="min">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">MIN</span>
                        Minimum
                      </div>
                    </SelectItem>
                    <SelectItem value="max">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">MAX</span>
                        Maximum
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ArrowUpDown size={12} />
                  Sort Order
                </Label>
                <Select
                  value={config.sortOrder}
                  onValueChange={(value) => onConfigChange({ sortOrder: value as ChartConfig['sortOrder'] })}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-50/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Original Order)</SelectItem>
                    <SelectItem value="asc">Ascending (Low → High)</SelectItem>
                    <SelectItem value="desc">Descending (High → Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Quick Tips */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-800/50 p-3">
        <div className="flex items-start gap-2">
          <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/30">
            <Sparkles size={12} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Quick Tip</p>
            <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
              {chartType === 'bar' && 'Use bar charts to compare categories. Try sorting by value for clearer insights.'}
              {chartType === 'line' && 'Line charts are great for showing trends over time. Enable labels to see exact values.'}
              {chartType === 'pie' && 'Pie charts show proportions best with 5 or fewer categories.'}
              {chartType === 'donut' && 'Donut charts add a modern look while showing the same proportional data.'}
              {chartType === 'scatter' && 'Scatter plots reveal correlations between two numeric variables.'}
              {chartType === 'area' && 'Area charts emphasize magnitude of change over time.'}
              {chartType === 'histogram' && 'Histograms show the distribution of a single numeric variable.'}
              {chartType === 'boxplot' && 'Box plots display statistical distribution including median and quartiles.'}
              {chartType === 'funnel' && 'Funnel charts are perfect for visualizing conversion stages.'}
              {chartType === 'heatmap' && 'Heatmaps reveal patterns in two-dimensional data through color intensity.'}
              {chartType === 'treemap' && 'Treemaps display hierarchical data as nested rectangles.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartConfigPanel;
