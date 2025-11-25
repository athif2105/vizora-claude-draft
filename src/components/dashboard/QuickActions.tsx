import React from 'react';
import { Plus, Upload, GitCompareArrows, BarChart3 } from 'lucide-react';

interface QuickActionsProps {
  onImportCSV: () => void;
  onCreateComparison: () => void;
  onViewAnalytics: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onImportCSV,
  onCreateComparison,
  onViewAnalytics
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={onImportCSV}
          className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left"
        >
          <div className="p-2 bg-blue-600 rounded-lg">
            <Upload className="text-white" size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Import CSV</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload funnel data</p>
          </div>
        </button>

        <button
          onClick={onCreateComparison}
          className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-left"
        >
          <div className="p-2 bg-purple-600 rounded-lg">
            <GitCompareArrows className="text-white" size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Compare Funnels</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Analyze differences</p>
          </div>
        </button>

        <button
          onClick={onViewAnalytics}
          className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-left"
        >
          <div className="p-2 bg-green-600 rounded-lg">
            <BarChart3 className="text-white" size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Insights & trends</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
