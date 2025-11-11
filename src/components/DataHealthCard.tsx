import React, { useState } from 'react';
import { CheckCircle, Clock, Database, AlertCircle, Info } from 'lucide-react';

interface DataHealthCardProps {
  hasData: boolean;
  totalRecords?: number;
  lastUpdated?: Date;
}

const DataHealthCard: React.FC<DataHealthCardProps> = ({ hasData, totalRecords = 0, lastUpdated }) => {
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return 'Just now';

    const now = new Date();
    const diffInMs = now.getTime() - lastUpdated.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMinutes > 0) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getStatus = () => {
    if (!hasData) return { label: 'No Data', color: 'text-gray-500 dark:text-gray-500', icon: AlertCircle };
    if (totalRecords === 0) return { label: 'Empty', color: 'text-yellow-600 dark:text-yellow-500', icon: AlertCircle };
    return { label: 'Healthy', color: 'text-green-600 dark:text-green-500', icon: CheckCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-transparent shadow-sm">
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Data Health & Volume</h3>
      <div className="space-y-3">
        <div className="flex items-center">
          <StatusIcon className={`${status.color} mr-2`} size={16} />
          <span className="text-sm text-gray-700 dark:text-gray-300">Status: <span className={status.color}>{status.label}</span></span>
          <div className="relative ml-1">
            <Info
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-help"
              size={14}
              onMouseEnter={() => setShowStatusTooltip(true)}
              onMouseLeave={() => setShowStatusTooltip(false)}
            />
            {showStatusTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 top-6 z-50 w-64 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg border border-gray-600 dark:border-gray-600">
                <div className="space-y-2">
                  <div>
                    <span className="text-green-400 font-semibold">Healthy:</span> Data is present and has at least 1 row
                  </div>
                  <div>
                    <span className="text-yellow-400 font-semibold">Empty:</span> CSV imported but contains 0 data rows
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold">No Data:</span> No CSV file has been imported yet
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="text-blue-600 dark:text-blue-400 mr-2" size={16} />
          <span className="text-sm text-gray-700 dark:text-gray-300">Freshness: <span className="text-blue-600 dark:text-blue-300">{hasData ? getTimeSinceUpdate() : 'No data'}</span></span>
        </div>
        <div className="flex items-center">
          <Database className="text-purple-600 dark:text-purple-400 mr-2" size={16} />
          <span className="text-sm text-gray-700 dark:text-gray-300">Volume: <span className="text-purple-600 dark:text-purple-300">{hasData ? `${totalRecords.toLocaleString()} records` : 'No data'}</span></span>
        </div>
      </div>
    </div>
  );
};

export default DataHealthCard;