import { TrendingUp, Clock, DollarSign } from 'lucide-react';

export const PriceCard = ({ price, loading }) => {
  const formatPrice = (value) => {
    if (value === 0) return '---';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value / 100);
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp === 0) return 'Never';
    
    const now = Date.now();
    const updateTime = timestamp * 1000;
    const diffMs = now - updateTime;
    
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffMs / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-rsk-orange" />
          <h3 className="text-lg font-semibold text-white">BTC Price</h3>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm text-green-400">Live</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold text-white">
          {loading ? (
            <div className="animate-pulse bg-gray-600 h-8 w-32 rounded"></div>
          ) : (
            <span className="text-rsk-orange">{formatPrice(price.value)}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Updated {formatTimestamp(price.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};