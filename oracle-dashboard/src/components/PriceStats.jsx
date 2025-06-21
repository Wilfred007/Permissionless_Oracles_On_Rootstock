import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const PriceChart = ({ currentPrice }) => {
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    if (currentPrice.value > 0) {
      const newDataPoint = {
        time: new Date().toLocaleTimeString(),
        price: currentPrice.value / 100,
        timestamp: Date.now()
      };

      setPriceHistory(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    }
  }, [currentPrice]);

  const formatTooltipValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-rsk-orange" />
        <span>Price History</span>
      </h3>
      
      <div className="h-64">
        {priceHistory.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={formatTooltipValue}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [formatTooltipValue(value), 'BTC Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#FF6B00" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#FF6B00', strokeWidth: 2, fill: '#FF6B00' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Collecting price data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};