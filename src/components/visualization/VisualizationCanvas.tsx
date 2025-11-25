import React, { useMemo, useState, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from 'next-themes';
import {
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

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

interface Dataset {
  name: string;
  rows: number;
  columns: DataColumn[];
  data?: Record<string, unknown>[];
}

interface VisualizationCanvasProps {
  chartType: ChartType;
  config: ChartConfig;
  dataset: Dataset;
}

// Aggregate data based on config
const aggregateData = (
  data: Record<string, unknown>[],
  xAxis: string | null,
  yAxis: string | null,
  aggregation: string
): { categories: string[]; values: number[]; totalCount: number } => {
  if (!xAxis || !yAxis || data.length === 0) {
    return { categories: [], values: [], totalCount: 0 };
  }

  // Group data by xAxis
  const groups: Record<string, number[]> = {};

  for (const row of data) {
    const category = String(row[xAxis] ?? 'Unknown');
    const value = Number(row[yAxis]) || 0;

    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(value);
  }

  // Aggregate each group
  const categories: string[] = [];
  const values: number[] = [];

  for (const [category, groupValues] of Object.entries(groups)) {
    categories.push(category);

    let aggregatedValue: number;
    switch (aggregation) {
      case 'sum':
        aggregatedValue = groupValues.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        aggregatedValue = groupValues.reduce((a, b) => a + b, 0) / groupValues.length;
        break;
      case 'count':
        aggregatedValue = groupValues.length;
        break;
      case 'min':
        aggregatedValue = Math.min(...groupValues);
        break;
      case 'max':
        aggregatedValue = Math.max(...groupValues);
        break;
      default:
        aggregatedValue = groupValues.reduce((a, b) => a + b, 0);
    }
    values.push(Math.round(aggregatedValue * 100) / 100);
  }

  return { categories, values, totalCount: categories.length };
};

// Generate chart data based on dataset and config with pagination
const generateChartData = (
  chartType: ChartType,
  config: ChartConfig,
  dataset: Dataset,
  pageStart: number = 0,
  pageSize: number = 10
) => {
  const data = dataset.data || [];

  // Get aggregated data from actual dataset
  const { categories: allCategories, values: allValues, totalCount } = aggregateData(
    data,
    config.xAxis,
    config.yAxis,
    config.aggregation
  );

  // Sort if configured (before pagination)
  let sortedCategories = [...allCategories];
  let sortedValues = [...allValues];

  if (config.sortOrder !== 'none' && sortedCategories.length > 0) {
    const paired = sortedCategories.map((cat, i) => ({ cat, val: sortedValues[i] }));
    if (config.sortOrder === 'asc') {
      paired.sort((a, b) => a.val - b.val);
    } else {
      paired.sort((a, b) => b.val - a.val);
    }
    sortedCategories = paired.map(p => p.cat);
    sortedValues = paired.map(p => p.val);
  }

  // Apply pagination
  const categories = sortedCategories.slice(pageStart, pageStart + pageSize);
  const values = sortedValues.slice(pageStart, pageStart + pageSize);

  // If no data available (no aggregated categories at all), use fallback sample data
  if (allCategories.length === 0) {
    const fallbackCategories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E'];
    const fallbackValues = [150, 230, 224, 218, 135];

    switch (chartType) {
      case 'bar':
      case 'histogram':
      case 'line':
      case 'area':
      case 'pie':
      case 'donut':
      case 'funnel':
        return { categories: fallbackCategories, values: fallbackValues, values2: [120, 200, 150, 180, 70], totalCount: 5 };
      case 'scatter':
        return {
          data: [
            [10.0, 8.04], [8.07, 6.95], [13.0, 7.58], [9.05, 8.81], [11.0, 8.33],
            [14.0, 7.66], [13.4, 6.81], [10.0, 6.33], [14.0, 8.96], [12.5, 6.82]
          ],
          totalCount: 10
        };
      case 'boxplot':
        return {
          categories: ['Q1', 'Q2', 'Q3', 'Q4'],
          data: [[850, 940, 960, 1070, 1090], [960, 1050, 1090, 1150, 1250], [880, 980, 1020, 1100, 1180], [920, 1020, 1080, 1170, 1280]],
          totalCount: 4
        };
      case 'heatmap':
        return {
          xCategories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          yCategories: ['Morning', 'Afternoon', 'Evening'],
          data: [[0, 0, 5], [0, 1, 1], [0, 2, 0], [1, 0, 7], [1, 1, 2], [1, 2, 3], [2, 0, 3], [2, 1, 6], [2, 2, 5], [3, 0, 2], [3, 1, 4], [3, 2, 8], [4, 0, 1], [4, 1, 3], [4, 2, 4]],
          totalCount: 5
        };
      case 'treemap':
        return {
          data: fallbackCategories.map((name, i) => ({ name, value: fallbackValues[i] })),
          totalCount: 5
        };
      default:
        return { categories: fallbackCategories, values: fallbackValues, totalCount: 5 };
    }
  }

  // Return data formatted for each chart type with totalCount
  switch (chartType) {
    case 'bar':
    case 'line':
    case 'area':
    case 'histogram':
      return { categories, values, values2: values.map(v => Math.round(v * 0.8)), totalCount };

    case 'pie':
    case 'donut':
    case 'funnel':
      return { categories, values, totalCount };

    case 'scatter':
      // For scatter, we need two numeric columns - apply pagination to scatter data
      const numericCols = dataset.columns.filter(c => c.type === 'number');
      if (numericCols.length >= 2 && data.length > 0) {
        const xCol = config.xAxis || numericCols[0].name;
        const yCol = config.yAxis || numericCols[1].name;
        const allScatterData = data.map(row => [Number(row[xCol]) || 0, Number(row[yCol]) || 0]);
        const scatterData = allScatterData.slice(pageStart, pageStart + pageSize);
        return { data: scatterData, totalCount: allScatterData.length };
      }
      return {
        data: categories.map((_, i) => [values[i] || 0, values[i] ? values[i] * 0.5 + Math.random() * 50 : 0]),
        totalCount
      };

    case 'boxplot':
      // Group values by category and calculate boxplot stats
      const boxplotData = categories.map((_, i) => {
        const baseValue = values[i];
        const spread = baseValue * 0.2;
        return [
          Math.round(baseValue - spread * 1.5),
          Math.round(baseValue - spread * 0.5),
          Math.round(baseValue),
          Math.round(baseValue + spread * 0.5),
          Math.round(baseValue + spread * 1.5)
        ];
      });
      return { categories, data: boxplotData, totalCount };

    case 'heatmap':
      // Create a heatmap from categories
      const xCategories = categories.slice(0, Math.min(5, categories.length));
      const yCategories = ['Low', 'Medium', 'High'];
      const heatmapData: number[][] = [];
      xCategories.forEach((_, xi) => {
        yCategories.forEach((_, yi) => {
          heatmapData.push([xi, yi, Math.round(Math.random() * 10)]);
        });
      });
      return { xCategories, yCategories, data: heatmapData, totalCount };

    case 'treemap':
      return {
        data: categories.map((name, i) => ({ name, value: values[i] })),
        totalCount
      };

    default:
      return { categories, values, totalCount };
  }
};

// Build ECharts option based on chart type
const buildChartOption = (
  chartType: ChartType,
  config: ChartConfig,
  data: any,
  isDark: boolean,
  zoomLevel: number
) => {
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const borderColor = isDark ? '#334155' : '#e2e8f0';
  const bgColor = 'transparent';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';

  // Color palette
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981',
    '#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#84cc16'
  ];

  // Apply zoom level to font sizes
  const titleFontSize = Math.round(16 * zoomLevel);
  const labelFontSize = Math.round(12 * zoomLevel);

  const baseOption = {
    backgroundColor: bgColor,
    color: colors,
    title: {
      text: config.title || `${config.yAxis || 'Value'} by ${config.xAxis || 'Category'}`,
      left: 'center',
      top: 16,
      textStyle: {
        color: textColor,
        fontSize: titleFontSize,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: borderColor,
      textStyle: { color: textColor },
      borderWidth: 1,
      borderRadius: 8,
      padding: [10, 14]
    },
    legend: config.showLegend ? {
      orient: 'vertical',
      right: 10,
      top: 70,
      textStyle: { color: textColor, fontSize: labelFontSize }
    } : undefined,
    grid: {
      top: 70,
      left: 60,
      right: config.showLegend ? 120 : 30,
      bottom: 30,
      containLabel: true
    },
    // Enable dataZoom for zoomable charts
    dataZoom: ['bar', 'line', 'area', 'scatter', 'histogram'].includes(chartType) ? [
      { type: 'inside', xAxisIndex: 0, start: 0, end: 100 },
      { type: 'inside', yAxisIndex: 0, start: 0, end: 100 }
    ] : undefined
  };

  switch (chartType) {
    case 'bar':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.categories,
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize },
          splitLine: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize },
          splitLine: { lineStyle: { color: gridColor } }
        },
        series: [{
          name: config.yAxis || 'Revenue',
          type: 'bar',
          data: data.values,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#8b5cf6' }] }
          },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(99, 102, 241, 0.5)' } },
          label: config.showLabels ? { show: true, position: 'top', color: textColor, fontSize: labelFontSize - 1 } : undefined
        }]
      };

    case 'line':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.categories,
          boundaryGap: false,
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize },
          splitLine: { lineStyle: { color: gridColor } }
        },
        series: [{
          name: config.yAxis || 'Value',
          type: 'line',
          data: data.values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8 * zoomLevel,
          lineStyle: { width: 3, color: '#6366f1' },
          itemStyle: { color: '#6366f1', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.3)' }, { offset: 1, color: 'rgba(99, 102, 241, 0.05)' }] }
          }
        }]
      };

    case 'area':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: data.categories,
          boundaryGap: false,
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: borderColor } },
          axisLabel: { color: textColor, fontSize: labelFontSize },
          splitLine: { lineStyle: { color: gridColor } }
        },
        series: [
          {
            name: 'Series A', type: 'line', stack: 'Total', data: data.values, smooth: true,
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(99, 102, 241, 0.5)' }, { offset: 1, color: 'rgba(99, 102, 241, 0.1)' }] } },
            lineStyle: { width: 2, color: '#6366f1' }
          },
          {
            name: 'Series B', type: 'line', stack: 'Total', data: data.values2, smooth: true,
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(139, 92, 246, 0.5)' }, { offset: 1, color: 'rgba(139, 92, 246, 0.1)' }] } },
            lineStyle: { width: 2, color: '#8b5cf6' }
          }
        ]
      };

    case 'pie':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          name: config.title || 'Distribution',
          type: 'pie',
          radius: ['0%', '70%'],
          center: ['50%', '55%'],
          data: data.categories.map((cat: string, i: number) => ({ name: cat, value: data.values[i] })),
          itemStyle: { borderRadius: 8, borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 3 },
          label: config.showLabels ? { show: true, color: textColor, fontSize: labelFontSize, formatter: '{b}: {d}%' } : { show: false },
          emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
        }]
      };

    case 'donut':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [{
          name: config.title || 'Distribution',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          data: data.categories.map((cat: string, i: number) => ({ name: cat, value: data.values[i] })),
          itemStyle: { borderRadius: 10, borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 3 },
          label: config.showLabels ? { show: true, position: 'outside', color: textColor, fontSize: labelFontSize - 1 } : { show: false },
          emphasis: { label: { show: true, fontSize: labelFontSize + 2, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
        }]
      };

    case 'scatter':
      return {
        ...baseOption,
        xAxis: { type: 'value', axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize }, splitLine: { lineStyle: { color: gridColor } } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{
          name: 'Correlation', type: 'scatter', data: data.data, symbolSize: 12 * zoomLevel,
          itemStyle: { color: { type: 'radial', x: 0.5, y: 0.5, r: 0.5, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#8b5cf6' }] }, shadowBlur: 5, shadowColor: 'rgba(99, 102, 241, 0.4)' },
          emphasis: { itemStyle: { shadowBlur: 15, shadowColor: 'rgba(99, 102, 241, 0.6)' } }
        }]
      };

    case 'histogram':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'axis' },
        xAxis: { type: 'category', data: ['0-20', '20-40', '40-60', '60-80', '80-100'], axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{
          type: 'bar', data: [12, 45, 78, 54, 23], barWidth: '80%',
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#f97316' }] }, borderRadius: [4, 4, 0, 0] }
        }]
      };

    case 'boxplot':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'item' },
        xAxis: { type: 'category', data: data.categories, axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize }, splitLine: { lineStyle: { color: gridColor } } },
        series: [{ type: 'boxplot', data: data.data, itemStyle: { color: '#6366f1', borderColor: '#4f46e5', borderWidth: 2 }, emphasis: { itemStyle: { borderWidth: 3, shadowBlur: 10 } } }]
      };

    case 'funnel':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, trigger: 'item', formatter: '{b}: {c}%' },
        series: [{
          name: 'Funnel', type: 'funnel', left: '10%', top: 60, bottom: 60, width: '80%', minSize: '0%', maxSize: '100%', sort: 'descending', gap: 4,
          label: { show: true, position: 'inside', color: '#fff', fontSize: labelFontSize + 1, fontWeight: 500 },
          itemStyle: { borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 2 },
          emphasis: { label: { fontSize: labelFontSize + 4 }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
          data: data.categories.map((cat: string, i: number) => ({ name: cat, value: data.values[i] }))
        }]
      };

    case 'heatmap':
      return {
        ...baseOption,
        tooltip: { ...baseOption.tooltip, position: 'top', formatter: (params: any) => `${data.xCategories[params.data[0]]} ${data.yCategories[params.data[1]]}: ${params.data[2]}` },
        grid: { ...baseOption.grid, top: 60, bottom: 80 },
        xAxis: { type: 'category', data: data.xCategories, splitArea: { show: true }, axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize } },
        yAxis: { type: 'category', data: data.yCategories, splitArea: { show: true }, axisLine: { lineStyle: { color: borderColor } }, axisLabel: { color: textColor, fontSize: labelFontSize } },
        visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: 10, textStyle: { color: textColor }, inRange: { color: ['#c7d2fe', '#818cf8', '#6366f1', '#4f46e5', '#4338ca'] } },
        series: [{ name: 'Value', type: 'heatmap', data: data.data, label: { show: true, color: textColor, fontSize: labelFontSize - 1 }, itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: isDark ? '#1e293b' : '#fff' }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } } }]
      };

    case 'treemap':
      return {
        ...baseOption,
        series: [{
          name: 'Treemap', type: 'treemap', data: data.data, top: 50, left: 10, right: 10, bottom: 10, roam: false, nodeClick: false, breadcrumb: { show: false },
          label: { show: true, formatter: '{b}', color: '#fff', fontSize: labelFontSize, fontWeight: 500 },
          upperLabel: { show: true, height: 24, color: '#fff' },
          itemStyle: { borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 2, gapWidth: 2, borderRadius: 4 },
          levels: [
            { itemStyle: { borderWidth: 3, borderColor: isDark ? '#1e293b' : '#e2e8f0', gapWidth: 3 }, upperLabel: { show: false } },
            { colorSaturation: [0.35, 0.5], itemStyle: { borderColorSaturation: 0.6, gapWidth: 1, borderWidth: 1 } }
          ]
        }]
      };

    default:
      return baseOption;
  }
};

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  chartType,
  config,
  dataset
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartRef = React.useRef<ReactECharts>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // State for zoom and fullscreen
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [customRangeStart, setCustomRangeStart] = useState('');
  const [customRangeEnd, setCustomRangeEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Calculate page start index
  const pageStart = (currentPage - 1) * pageSize;

  // Generate chart data with pagination
  const chartData = useMemo(
    () => generateChartData(chartType, config, dataset, pageStart, pageSize),
    [chartType, config, dataset, pageStart, pageSize]
  );

  // Get total count and calculate total pages
  const totalCount = chartData.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset page when dataset or config changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [dataset, config.xAxis, config.yAxis, config.sortOrder]);

  const chartOption = useMemo(
    () => buildChartOption(chartType, config, chartData, isDark, zoomLevel),
    [chartType, config, chartData, isDark, zoomLevel]
  );

  // Pagination handlers
  const handleFirstPage = useCallback(() => setCurrentPage(1), []);
  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(1, p - 1)), []);
  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(totalPages, p + 1)), [totalPages]);
  const handleLastPage = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    const start = parseInt(customRangeStart) || 1;
    const end = parseInt(customRangeEnd) || totalCount;

    if (start < 1 || start > totalCount) {
      toast.error(`Start must be between 1 and ${totalCount}`);
      return;
    }
    if (end < start || end > totalCount) {
      toast.error(`End must be between ${start} and ${totalCount}`);
      return;
    }

    // Calculate the new page size and page
    const rangeSize = end - start + 1;
    setPageSize(rangeSize);
    setCurrentPage(1);
    // Manually set the start index
    const newPageStart = start - 1;
    setCurrentPage(Math.floor(newPageStart / rangeSize) + 1);
    setShowCustomRange(false);
    toast.success(`Showing rows ${start} to ${end}`);
  }, [customRangeStart, customRangeEnd, totalCount]);

  // Zoom In
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 0.1, 2);
      toast.success(`Zoom: ${Math.round(newZoom * 100)}%`);
      return newZoom;
    });
  }, []);

  // Zoom Out
  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.1, 0.5);
      toast.success(`Zoom: ${Math.round(newZoom * 100)}%`);
      return newZoom;
    });
  }, []);

  // Reset Zoom
  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
    }
    toast.success('Zoom reset to 100%');
  }, []);

  // Refresh chart
  const handleRefresh = useCallback(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      echartsInstance.resize();
      echartsInstance.setOption(chartOption, true);
    }
    toast.success('Chart refreshed');
  }, [chartOption]);

  // Download as PNG
  const handleDownload = useCallback(() => {
    if (chartRef.current) {
      const echartsInstance = chartRef.current.getEchartsInstance();
      const url = echartsInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: isDark ? '#0f172a' : '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `vizora-${chartType}-chart-${Date.now()}.png`;
      link.href = url;
      link.click();
      toast.success('Chart downloaded as PNG');
    }
  }, [chartType, isDark]);

  // Copy chart as image to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    if (chartRef.current) {
      try {
        const echartsInstance = chartRef.current.getEchartsInstance();
        const url = echartsInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: isDark ? '#0f172a' : '#ffffff'
        });

        // Convert data URL to blob
        const response = await fetch(url);
        const blob = await response.blob();

        // Copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);

        setCopied(true);
        toast.success('Chart copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  }, [isDark]);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize chart after fullscreen change
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.getEchartsInstance().resize();
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-300/30 dark:shadow-slate-950/50 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
    >
      {/* Gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 via-pink-500 to-rose-500" />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/50 dark:border-indigo-800/50">
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 capitalize">{chartType} Chart</span>
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {pageStart + 1}-{Math.min(pageStart + pageSize, totalCount)} of {totalCount} items
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ZoomIn size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In (+10%)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ZoomOut size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out (-10%)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RotateCcw size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Zoom (100%)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RefreshCw size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Chart</TooltipContent>
          </Tooltip>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyToClipboard}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to Clipboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Download size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PNG</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-4 min-h-0">
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Pagination Controls */}
      {totalCount > 5 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Show:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-slate-500 dark:text-slate-400">items</span>

            {/* Custom Range Toggle */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
            {!showCustomRange ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomRangeStart(String(pageStart + 1));
                  setCustomRangeEnd(String(Math.min(pageStart + pageSize, totalCount)));
                  setShowCustomRange(true);
                }}
                className="h-7 text-xs text-slate-600 dark:text-slate-400"
              >
                Custom Range
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={totalCount}
                  value={customRangeStart}
                  onChange={(e) => setCustomRangeStart(e.target.value)}
                  placeholder="From"
                  className="h-7 w-16 text-xs"
                />
                <span className="text-xs text-slate-500">to</span>
                <Input
                  type="number"
                  min={1}
                  max={totalCount}
                  value={customRangeEnd}
                  onChange={(e) => setCustomRangeEnd(e.target.value)}
                  placeholder="To"
                  className="h-7 w-16 text-xs"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApplyCustomRange}
                  className="h-7 text-xs px-2"
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomRange(false)}
                  className="h-7 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">
              Page {currentPage} of {totalPages}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ChevronsLeft size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>First Page</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ChevronLeft size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous ({pageSize} items)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ChevronRight size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next ({pageSize} items)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <ChevronsRight size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Last Page</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationCanvas;
