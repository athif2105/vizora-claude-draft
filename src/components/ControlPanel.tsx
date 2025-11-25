import React, { useState } from 'react';
import PreviewTab from './PreviewTab';
import DataTab from './DataTab';
import StepsTab from './StepsTab';

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

interface ControlPanelProps {
  hasData: boolean;
  conversionRate: number;
  totalUsers: number;
  totalSteps: number;
  steps: FunnelStep[];
  onImport: (data: any[], fileName: string) => void;
  onAddStep: () => void;
  isGAConnected: boolean;
  dataSource: 'csv' | 'ga';
  onDataSourceChange: (source: 'csv' | 'ga') => void;
  importedFileName: string | null;
  lastUpdated?: Date;
  biggestDropOff: { fromStep: number; toStep: number; dropPercentage: number };
  totalRecords?: number;
  hasFunnelB: boolean;
  onImportFunnelB: (data: any[], fileName: string) => void;
  funnelBFileName: string | null;
  onRemoveFunnelA?: () => void;
  onRemoveFunnelB?: () => void;
  onSwapFunnels?: () => void;
  isComparisonMode?: boolean;
  onToggleComparison?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  hasData,
  conversionRate,
  totalUsers,
  totalSteps,
  steps,
  onImport,
  onAddStep,
  isGAConnected,
  dataSource,
  onDataSourceChange,
  importedFileName,
  lastUpdated,
  biggestDropOff,
  totalRecords,
  hasFunnelB,
  onImportFunnelB,
  funnelBFileName,
  onRemoveFunnelA,
  onRemoveFunnelB,
  onSwapFunnels,
  isComparisonMode,
  onToggleComparison
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'steps' | 'preview'>('data');

  const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'csv' | 'ga';
    onDataSourceChange(value);

    // When CSV is selected, activate the Data tab
    if (value === 'csv') {
      setActiveTab('data');
    }
  };

  return (
    <div className="w-[22rem] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Data Source Selector */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Select a data source:</div>
        <select
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dataSource}
          onChange={handleDataSourceChange}
        >
          <option value="csv">CSV File</option>
          <option value="ga">Google Analytics</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-4">
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'data'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : dataSource === 'csv'
                  ? 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100'
                  : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('data')}
            disabled={dataSource !== 'csv'}
          >
            Data
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'steps'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('steps')}
          >
            Steps
          </button>
          <button
            className={`pb-2 px-1 text-sm font-medium ${
              activeTab === 'preview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-dark">
        {activeTab === 'data' && (
          <DataTab
            hasData={hasData}
            funnels={[]} // Keep recent funnels list empty as requested
            onImport={onImport}
            importedFileName={importedFileName}
            hasFunnelB={hasFunnelB}
            onImportFunnelB={onImportFunnelB}
            funnelBFileName={funnelBFileName}
            onRemoveFunnelA={onRemoveFunnelA}
            onRemoveFunnelB={onRemoveFunnelB}
            onSwapFunnels={onSwapFunnels}
            isComparisonMode={isComparisonMode}
            onToggleComparison={onToggleComparison}
          />
        )}
        
        {activeTab === 'steps' && (
          <StepsTab 
            hasData={hasData}
            steps={steps}
            onAddStep={onAddStep}
          />
        )}
        
        {activeTab === 'preview' && (
          <PreviewTab
            hasData={hasData}
            conversionRate={conversionRate}
            totalUsers={totalUsers}
            totalSteps={totalSteps}
            lastUpdated={lastUpdated}
            biggestDropOff={biggestDropOff}
            totalRecords={totalRecords}
            steps={steps}
          />
        )}
      </div>
    </div>
  );
};

export default ControlPanel;