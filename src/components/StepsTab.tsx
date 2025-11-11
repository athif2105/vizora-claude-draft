import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical } from 'lucide-react';

interface FunnelStep {
  id: string;
  name: string;
  order: number;
}

interface StepsTabProps {
  hasData: boolean;
  steps: FunnelStep[];
  onAddStep: () => void;
}

const StepsTab: React.FC<StepsTabProps> = ({ hasData, steps, onAddStep }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Funnel Steps</h3>
        <Button
          onClick={onAddStep}
          disabled={!hasData}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus size={16} className="mr-1" />
          Add Step
        </Button>
      </div>

      {steps.length > 0 ? (
        <div className="space-y-2">
          {steps.map((step, index) => {
            // Remove number prefix from step name (e.g., "1. App open" → "App open")
            const cleanStepName = step.name.replace(/^\d+\.\s*/, '');

            return (
              <div
                key={step.id}
                className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-transparent shadow-sm hover:shadow-md transition-shadow"
              >
                <GripVertical className="text-gray-400 dark:text-gray-500 mr-2 cursor-move" size={16} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{cleanStepName}</p>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Step {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-500">
          <p>{hasData ? "No steps defined yet" : "Import data to define funnel steps"}</p>
        </div>
      )}
    </div>
  );
};

export default StepsTab;