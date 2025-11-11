import React from 'react';
import { TrendingUp, Users, Layers } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  hasData: boolean;
  type?: 'conversion' | 'users' | 'steps';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, hasData, type = 'users' }) => {
  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'conversion':
        return <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />;
      case 'users':
        return <Users size={16} className="text-purple-600 dark:text-purple-400" />;
      case 'steps':
        return <Layers size={16} className="text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  // Get conversion rate assessment and color
  const getConversionAssessment = () => {
    if (type !== 'conversion' || !hasData) return null;

    const rate = parseFloat(value.toString().replace('%', ''));

    if (rate >= 70) {
      return { label: 'Excellent', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-700/50' };
    } else if (rate >= 50) {
      return { label: 'Good', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-700/50' };
    } else if (rate >= 30) {
      return { label: 'Fair', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-700/50' };
    } else {
      return { label: 'Poor', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-700/50' };
    }
  };

  const assessment = getConversionAssessment();

  return (
    <div className={`rounded-lg p-3 border ${assessment ? `${assessment.bgColor} ${assessment.borderColor}` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'} flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow`}>
      <div className="mb-2">
        {getIcon()}
      </div>
      <h3 className="text-[10px] font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      {hasData ? (
        <>
          <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{value}</p>
          {assessment && (
            <p className={`text-[10px] font-medium ${assessment.color}`}>{assessment.label}</p>
          )}
        </>
      ) : (
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      )}
    </div>
  );
};

export default MetricCard;