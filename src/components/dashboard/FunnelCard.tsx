import React from 'react';
import { FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FunnelCardProps {
  id: string;
  name: string;
  conversionRate: number;
  totalUsers: number;
  steps: number;
  createdAt: Date;
  onClick: () => void;
}

const FunnelCard: React.FC<FunnelCardProps> = ({
  name,
  conversionRate,
  totalUsers,
  steps,
  createdAt,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600 dark:text-blue-400" size={18} />
          <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <TrendingUp size={14} />
          <span>{conversionRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Steps</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{steps}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{totalUsers.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Records</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">-</p>
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
        <Calendar size={12} />
        <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
      </div>
    </div>
  );
};

export default FunnelCard;
