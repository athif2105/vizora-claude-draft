import React from 'react';
import { 
  ResponsiveContainer, 
  FunnelChart as RechartsFunnelChart, 
  Funnel, 
  Tooltip, 
  LabelList 
} from 'recharts';

interface FunnelChartProps {
  data: any[];
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
  // Transform data for the funnel chart
  const funnelData = data.map((item: any, index: number) => ({
    ...item,
    value: Number(item.Value || item.value),
    index
  })).filter(item => !isNaN(item.value));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-cyan-400 font-bold">{data.Stage || data.stage}</p>
          <p className="text-gray-300">Value: {data.value.toLocaleString()}</p>
          {data.index > 0 && (
            <p className="text-gray-400 text-sm">
              Conversion: {((data.value / funnelData[0].value) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
          >
            <LabelList 
              position="right" 
              fill="#fff" 
              stroke="none" 
              dataKey="Stage" 
              className="text-sm"
            />
            <LabelList 
              position="left" 
              fill="#fff" 
              stroke="none" 
              dataKey="value" 
              className="text-sm"
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
};