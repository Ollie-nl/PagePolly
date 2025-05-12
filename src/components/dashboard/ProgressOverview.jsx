import React from 'react';
import Card from '../common/Card';

/**
 * Component to display crawl progress overview for vendors
 * 
 * @param {Object} props - Component props
 * @param {Array} props.vendors - List of vendors
 * @param {Object} props.progress - Object with progress data by vendor ID
 */
function ProgressOverview({ vendors = [], progress = {} }) {
  // Ensure vendors is an array
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  
  // Ensure progress is an object
  const safeProgress = progress && typeof progress === 'object' ? progress : {};
  
  // Calculate overall progress statistics
  const totalVendors = safeVendors.length;
  const crawledVendors = safeVendors.filter(vendor => {
    if (!vendor || typeof vendor !== 'object') return false;
    return safeProgress[vendor.id]?.percentage === 100 || safeProgress[vendor.id]?.status === 'completed';
  }).length;
  
  const overallPercentage = totalVendors === 0 ? 0 : Math.round((crawledVendors / totalVendors) * 100);
  
  // Group vendors by status
  const vendorsByStatus = {
    completed: safeVendors.filter(v => {
      if (!v || typeof v !== 'object') return false;
      return safeProgress[v.id]?.status === 'completed' || safeProgress[v.id]?.percentage === 100;
    }),
    running: safeVendors.filter(v => {
      if (!v || typeof v !== 'object') return false;
      return safeProgress[v.id]?.status === 'running' && safeProgress[v.id]?.percentage < 100;
    }),
    failed: safeVendors.filter(v => {
      if (!v || typeof v !== 'object') return false;
      return safeProgress[v.id]?.status === 'failed';
    }),
    notStarted: safeVendors.filter(v => {
      if (!v || typeof v !== 'object') return false;
      return !safeProgress[v.id];
    })
  };

  return (
    <Card title="Crawl Progress Overview">
      <div className="space-y-6">
        {/* Overall progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-700">{overallPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {typeof crawledVendors === 'number' ? crawledVendors : 0} out of {typeof totalVendors === 'number' ? totalVendors : 0} vendors completed
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-xs font-medium text-green-800 uppercase">Completed</div>
            <div className="mt-1 text-2xl font-semibold text-green-700">
              {Array.isArray(vendorsByStatus.completed) ? vendorsByStatus.completed.length : 0}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xs font-medium text-blue-800 uppercase">In Progress</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">
              {Array.isArray(vendorsByStatus.running) ? vendorsByStatus.running.length : 0}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-xs font-medium text-red-800 uppercase">Failed</div>
            <div className="mt-1 text-2xl font-semibold text-red-700">
              {Array.isArray(vendorsByStatus.failed) ? vendorsByStatus.failed.length : 0}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs font-medium text-gray-800 uppercase">Not Started</div>
            <div className="mt-1 text-2xl font-semibold text-gray-700">
              {Array.isArray(vendorsByStatus.notStarted) ? vendorsByStatus.notStarted.length : 0}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {Array.isArray(vendorsByStatus.running) && vendorsByStatus.running.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Currently Running</h4>
            <div className="space-y-3">
              {vendorsByStatus.running.map(vendor => {
                // Skip rendering if vendor is invalid
                if (!vendor || typeof vendor !== 'object' || !vendor.id) return null;
                
                // Get progress data safely
                const vendorProgress = progress && progress[vendor.id] ? progress[vendor.id] : { percentage: 0 };
                const percentage = typeof vendorProgress.percentage === 'number' ? vendorProgress.percentage : 0;
                
                return (
                  <div key={vendor.id} className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{vendor.name || 'Unknown Vendor'}</div>
                      <div className="text-xs text-gray-500 truncate">{vendor.url || 'No URL'}</div>
                    </div>
                    <div className="w-24">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-right text-gray-500">
                        {percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ProgressOverview;