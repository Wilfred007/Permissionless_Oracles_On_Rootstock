import { Network, Users, RotateCcw, Settings } from 'lucide-react';
import { ethers } from 'ethers';

export const NetworkStats = ({ nodeCount, currentRound, config, loading }) => {
  const StatCard = ({ icon: Icon, label, value, subtext }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <Icon className="h-8 w-8 text-rsk-orange" />
        <div>
          <div className="text-2xl font-bold text-white">
            {loading ? (
              <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
          <div className="text-sm text-gray-400">{label}</div>
          {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Network className="h-5 w-5 text-rsk-orange" />
        <span>Network Statistics</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Users} 
          label="Active Nodes" 
          value={nodeCount}
          subtext={`Min stake: ${ethers.formatEther(config.minStake || '0')} RBTC`}
        />
        
        <StatCard 
          icon={RotateCcw} 
          label="Current Round" 
          value={currentRound}
          subtext={`Threshold: ${config.threshold} nodes`}
        />
        
        <StatCard 
          icon={Settings} 
          label="Update Interval" 
          value={`${config.interval}s`}
          subtext="Price update frequency"
        />
        
        <StatCard 
          icon={Network} 
          label="Consensus" 
          value={`${config.threshold}/${nodeCount}`}
          subtext="Required/Active"
        />
      </div>
    </div>
  );
};