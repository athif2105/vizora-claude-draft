import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import MetricCard from './MetricCard';
import DataHealthCard from './DataHealthCard';

interface FunnelStep {
  id: string;
  name: string;
  order: number;
  value: number;
  completionRate: number;
  abandonmentRate: number;
  elapsedTime: number;
  activeUsers: number;
  abandonments: number;
}

interface PreviewTabProps {
  hasData: boolean;
  conversionRate: number;
  totalUsers: number;
  totalSteps: number;
  lastUpdated?: Date;
  biggestDropOff: { fromStep: number; toStep: number; dropPercentage: number };
  totalRecords?: number;
  steps: FunnelStep[];
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  hasData,
  conversionRate,
  totalUsers,
  totalSteps,
  lastUpdated,
  biggestDropOff,
  totalRecords,
  steps
}) => {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard
          title="Conversion Rate"
          value={hasData ? `${conversionRate.toFixed(1)}%` : '--'}
          hasData={hasData}
          type="conversion"
        />
        <MetricCard
          title="Total Users"
          value={hasData ? totalUsers.toLocaleString() : '--'}
          hasData={hasData}
          type="users"
        />
        <MetricCard
          title="Total Steps"
          value={hasData ? totalSteps : '--'}
          hasData={hasData}
          type="steps"
        />
      </div>
      
      <DataHealthCard hasData={hasData} totalRecords={totalRecords} lastUpdated={lastUpdated} />

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-transparent shadow-sm">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Funnel Insights</h3>
        {hasData ? (
          <div className="space-y-4">
            {/* Step-by-step drop-off breakdown */}
            {steps.length > 1 && (
              <div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Step Transitions</div>
                <div className="space-y-2">
                  {steps.map((step, index) => {
                    if (index === steps.length - 1) return null; // Skip last step

                    const currentUsers = steps[index].activeUsers;
                    const nextUsers = steps[index + 1].activeUsers;

                    // Handle edge cases
                    let dropPercentage: number;
                    let retentionPercentage: number;
                    let isCompleteDropOff = false;
                    let isNoData = false;

                    if (currentUsers === 0 && nextUsers === 0) {
                      // Both steps have no users
                      isNoData = true;
                      dropPercentage = 0;
                      retentionPercentage = 0;
                    } else if (currentUsers === 0) {
                      // Current step has no users, can't calculate
                      isNoData = true;
                      dropPercentage = 0;
                      retentionPercentage = 0;
                    } else if (nextUsers === 0) {
                      // Complete drop-off (100% drop)
                      isCompleteDropOff = true;
                      dropPercentage = 100;
                      retentionPercentage = 0;
                    } else {
                      // Normal calculation
                      dropPercentage = ((currentUsers - nextUsers) / currentUsers) * 100;
                      retentionPercentage = 100 - dropPercentage;
                    }

                    return (
                      <div key={index} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                        {/* Header */}
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Step {index + 1} → Step {index + 2}
                        </div>

                        {isNoData ? (
                          <div className="text-xs text-gray-500 dark:text-gray-500">No data available</div>
                        ) : (
                          <div className="space-y-2">
                            {/* Continued users */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="text-green-600 dark:text-green-500" size={14} />
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  {nextUsers.toLocaleString()} continued
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                {retentionPercentage.toFixed(1)}%
                              </span>
                            </div>

                            {/* Dropped users */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <XCircle className="text-red-600 dark:text-red-500" size={14} />
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  {(currentUsers - nextUsers).toLocaleString()} dropped off
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                {dropPercentage.toFixed(1)}%
                              </span>
                            </div>

                            {/* Split bar showing continuation vs drop-off */}
                            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                              <div
                                className="bg-green-500"
                                style={{ width: `${retentionPercentage}%` }}
                              ></div>
                              <div
                                className="bg-red-500"
                                style={{ width: `${dropPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Biggest drop-off alert */}
            {biggestDropOff.dropPercentage > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700/50 rounded-lg p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">⚠</span>
                  <div>
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Attention Required</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-200/80 mt-1">
                      Biggest drop-off between Steps {biggestDropOff.fromStep} → {biggestDropOff.toStep}
                      <span className="font-semibold"> ({biggestDropOff.dropPercentage.toFixed(1)}% drop)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTab;