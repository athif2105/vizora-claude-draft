import React from 'react';
import {
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  CircleDot,
  ScatterChart,
  BarChart2,
  BoxSelect,
  Filter,
  Grid3X3,
  TreeDeciduous,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

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

interface ChartOption {
  type: ChartType;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

interface ChartSelectionGridProps {
  selectedType: ChartType;
  onSelectType: (type: ChartType) => void;
}

const chartOptions: ChartOption[] = [
  {
    type: 'bar',
    name: 'Bar',
    icon: BarChart3,
    description: 'Compare categories with vertical bars',
    color: 'text-blue-600 dark:text-blue-400',
    gradientFrom: 'from-blue-500/20',
    gradientTo: 'to-blue-600/10'
  },
  {
    type: 'line',
    name: 'Line',
    icon: LineChart,
    description: 'Show trends over time',
    color: 'text-emerald-600 dark:text-emerald-400',
    gradientFrom: 'from-emerald-500/20',
    gradientTo: 'to-emerald-600/10'
  },
  {
    type: 'area',
    name: 'Area',
    icon: AreaChart,
    description: 'Visualize cumulative totals',
    color: 'text-cyan-600 dark:text-cyan-400',
    gradientFrom: 'from-cyan-500/20',
    gradientTo: 'to-cyan-600/10'
  },
  {
    type: 'pie',
    name: 'Pie',
    icon: PieChart,
    description: 'Show parts of a whole',
    color: 'text-violet-600 dark:text-violet-400',
    gradientFrom: 'from-violet-500/20',
    gradientTo: 'to-violet-600/10'
  },
  {
    type: 'donut',
    name: 'Donut',
    icon: CircleDot,
    description: 'Pie chart with center cutout',
    color: 'text-pink-600 dark:text-pink-400',
    gradientFrom: 'from-pink-500/20',
    gradientTo: 'to-pink-600/10'
  },
  {
    type: 'scatter',
    name: 'Scatter',
    icon: ScatterChart,
    description: 'Show correlation between variables',
    color: 'text-orange-600 dark:text-orange-400',
    gradientFrom: 'from-orange-500/20',
    gradientTo: 'to-orange-600/10'
  },
  {
    type: 'histogram',
    name: 'Histogram',
    icon: BarChart2,
    description: 'Display distribution of data',
    color: 'text-amber-600 dark:text-amber-400',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-amber-600/10'
  },
  {
    type: 'boxplot',
    name: 'Box Plot',
    icon: BoxSelect,
    description: 'Show statistical distribution',
    color: 'text-indigo-600 dark:text-indigo-400',
    gradientFrom: 'from-indigo-500/20',
    gradientTo: 'to-indigo-600/10'
  },
  {
    type: 'funnel',
    name: 'Funnel',
    icon: Filter,
    description: 'Visualize conversion stages',
    color: 'text-purple-600 dark:text-purple-400',
    gradientFrom: 'from-purple-500/20',
    gradientTo: 'to-purple-600/10'
  },
  {
    type: 'heatmap',
    name: 'Heatmap',
    icon: Grid3X3,
    description: 'Show density with color intensity',
    color: 'text-red-600 dark:text-red-400',
    gradientFrom: 'from-red-500/20',
    gradientTo: 'to-red-600/10'
  },
  {
    type: 'treemap',
    name: 'Treemap',
    icon: TreeDeciduous,
    description: 'Display hierarchical data',
    color: 'text-teal-600 dark:text-teal-400',
    gradientFrom: 'from-teal-500/20',
    gradientTo: 'to-teal-600/10'
  }
];

const ChartSelectionGrid: React.FC<ChartSelectionGridProps> = ({
  selectedType,
  onSelectType
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      {/* Container with 3D-ish depth */}
      <div className="rounded-2xl bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xl shadow-slate-300/30 dark:shadow-slate-950/50 overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-orange-500" />

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20">
              <Sparkles size={14} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Select Chart Type</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollLeft}
              className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollRight}
              className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        {/* Chart options grid */}
        <div
          ref={containerRef}
          className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {chartOptions.map((option) => {
            const isSelected = selectedType === option.type;
            const Icon = option.icon;

            return (
              <Tooltip key={option.type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectType(option.type)}
                    className={`
                      group relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden
                      transition-all duration-300 ease-out
                      ${isSelected
                        ? `bg-gradient-to-br ${option.gradientFrom} ${option.gradientTo} border-2 border-current ${option.color} shadow-lg shadow-current/20 scale-105`
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md hover:scale-102'
                      }
                    `}
                  >
                    {/* Selected indicator glow */}
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.gradientFrom} ${option.gradientTo} opacity-50 blur-xl`} />
                    )}

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                      {/* Name - above the icon */}
                      <span className={`text-xs font-medium mb-2 ${isSelected ? option.color : 'text-slate-600 dark:text-slate-300'}`}>
                        {option.name}
                      </span>

                      {/* Icon */}
                      <Icon
                        size={28}
                        className={`transition-transform group-hover:scale-110 ${isSelected ? option.color : 'text-slate-500 dark:text-slate-400'}`}
                      />
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 dark:group-hover:bg-white/5 transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="font-medium">{option.name} Chart</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartSelectionGrid;
