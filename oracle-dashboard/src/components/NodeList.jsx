import { Shield, Wallet, Star, AlertTriangle, Users } from 'lucide-react';
import { ethers } from 'ethers';

export const NodeList = ({ nodes, loading }) => {
  const getReputationColor = (reputation) => {
    if (reputation >= 90) return 'text-green-400';
    if (reputation >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReputationIcon = (reputation) => {
    if (reputation >= 90) return Shield;
    if (reputation >= 70) return Star;
    return AlertTriangle;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Oracle Nodes</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-700 h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Users className="h-5 w-5 text-rsk-orange" />
        <span>Oracle Nodes ({nodes.length})</span>
      </h3>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {nodes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active nodes found</p>
          </div>
        ) : (
          nodes.map((node, index) => {
            const ReputationIcon = getReputationIcon(node.reputation);
            
            return (
              <div key={node.address} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-rsk-orange bg-opacity-20 rounded-full p-2">
                      <Wallet className="h-4 w-4 text-rsk-orange" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        Node #{index + 1}
                      </div>
                      <div className="text-xs font-mono text-gray-400">
                        {node.address.slice(0, 10)}...{node.address.slice(-8)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <ReputationIcon className={`h-4 w-4 ${getReputationColor(node.reputation)}`} />
                      <span className={`text-sm font-medium ${getReputationColor(node.reputation)}`}>
                        {node.reputation}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {parseFloat(ethers.formatEther(node.stake)).toFixed(4)} RBTC
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};