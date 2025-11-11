import React from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import FunnelVisualization from './FunnelVisualization';

interface FunnelStep {
  id: string;
  name: string;
  value: number;
  segment?: string;
  country?: string;
  completionRate: number;
  abandonmentRate: number;
  elapsedTime: number;
  activeUsers: number;
  abandonments: number;
  order: number;
}

interface ComparisonViewProps {
  funnelAData: FunnelStep[];
  funnelBData: FunnelStep[];
  funnelAName: string;
  funnelBName: string;
  funnelASteps: FunnelStep[];
  funnelBSteps: FunnelStep[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  funnelAData,
  funnelBData,
  funnelAName,
  funnelBName,
  funnelASteps,
  funnelBSteps
}) => {
  // Calculate metrics for both funnels
  const calculateMetrics = (steps: FunnelStep[]) => {
    if (steps.length === 0) return { conversionRate: 0, totalUsers: 0, totalSteps: 0 };

    const conversionRate = (steps[steps.length - 1].activeUsers / steps[0].activeUsers) * 100;
    const totalUsers = steps.reduce((sum, step) => sum + step.activeUsers, 0);
    const totalSteps = steps.length;

    return { conversionRate, totalUsers, totalSteps };
  };

  const metricsA = calculateMetrics(funnelASteps);
  const metricsB = calculateMetrics(funnelBSteps);

  // Calculate differences
  const conversionDiff = metricsB.conversionRate - metricsA.conversionRate;
  const usersDiff = metricsB.totalUsers - metricsA.totalUsers;
  const stepsDiff = metricsB.totalSteps - metricsA.totalSteps;

  const formatDiff = (diff: number, suffix: string = '') => {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}${suffix}`;
  };

  return (
    <div className="h-full p-6 overflow-y-auto scrollbar-dark">
      {/* Comparison Metrics Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Funnel Comparison</h2>

        <div className="grid grid-cols-3 gap-6">
          {/* Conversion Rate Comparison */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide text-center font-semibold">Conversion Rate</div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel A</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsA.conversionRate.toFixed(1)}%</div>
              </div>
              <ArrowRight className="text-gray-400 dark:text-gray-600 mx-2" size={20} />
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel B</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metricsB.conversionRate.toFixed(1)}%</div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
              <div className={`text-sm flex items-center justify-center font-medium ${conversionDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {conversionDiff >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {formatDiff(conversionDiff, '%')} difference
              </div>
            </div>
          </div>

          {/* Total Users Comparison */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide text-center font-semibold">Total Users</div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel A</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsA.totalUsers.toLocaleString()}</div>
              </div>
              <ArrowRight className="text-gray-400 dark:text-gray-600 mx-2" size={20} />
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel B</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metricsB.totalUsers.toLocaleString()}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
              <div className={`text-sm flex items-center justify-center font-medium ${usersDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {usersDiff >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                {formatDiff(usersDiff)} difference
              </div>
            </div>
          </div>

          {/* Total Steps Comparison */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide text-center font-semibold">Total Steps</div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel A</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricsA.totalSteps}</div>
              </div>
              <ArrowRight className="text-gray-400 dark:text-gray-600 mx-2" size={20} />
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Funnel B</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metricsB.totalSteps}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
              {stepsDiff !== 0 ? (
                <div className={`text-sm flex items-center justify-center font-medium ${stepsDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stepsDiff >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                  {formatDiff(stepsDiff)} steps
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-500 text-center font-medium">No difference</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Funnels */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Funnel A */}
        <div className="flex flex-col">
          <div className="mb-3 px-2">
            <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400">Funnel A</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{funnelAName}</p>
          </div>
          <div className="h-[800px] flex flex-col overflow-y-auto scrollbar-dark">
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.65%' }}>
              <FunnelVisualization data={funnelAData} hasData={true} importedFileName={funnelAName} />
            </div>
          </div>
        </div>

        {/* Funnel B */}
        <div className="flex flex-col">
          <div className="mb-3 px-2">
            <h3 className="text-base font-semibold text-purple-600 dark:text-purple-400">Funnel B</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{funnelBName}</p>
          </div>
          <div className="h-[800px] flex flex-col overflow-y-auto scrollbar-dark">
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.65%' }}>
              <FunnelVisualization data={funnelBData} hasData={true} importedFileName={funnelBName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
