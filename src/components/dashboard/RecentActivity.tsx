import React from 'react';
import { Clock, FileText, GitCompareArrows, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'import' | 'compare' | 'share' | 'view';
  description: string;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'import':
        return <FileText className="text-blue-600 dark:text-blue-400" size={16} />;
      case 'compare':
        return <GitCompareArrows className="text-purple-600 dark:text-purple-400" size={16} />;
      case 'share':
        return <Share2 className="text-green-600 dark:text-green-400" size={16} />;
      case 'view':
        return <Clock className="text-gray-600 dark:text-gray-400" size={16} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
        Recent Activity
      </h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="mt-0.5">{getIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
