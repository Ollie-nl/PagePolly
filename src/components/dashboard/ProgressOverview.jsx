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
  // Calculate overall progress statistics
  const totalVendors = vendors.length;
  const crawledVendors = vendors.filter(vendor => 
    progress[vendor.id]?.percentage === 100 || progress[vendor.id]?.status === 'completed'
  ).length;
  
  const overallPercentage = totalVendors === 0 ? 0 : Math.round((crawledVendors / totalVendors) * 100);
  
  // Group vendors by status
  const vendorsByStatus = {
    completed: vendors.filter(v => progress[v.id]?.status === 'completed' || progress[v.id]?.percentage === 100),
    running: vendors.filter(v => progress[v.id]?.status === 'running' && progress[v.id]?.percentage < 100),
    failed: vendors.filter(v => progress[v.id]?.status === 'failed'),
    notStarted: vendors.filter(v => !progress[v.id])
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
            {crawledVendors} out of {totalVendors} vendors completed
          </div>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-xs font-medium text-green-800 uppercase">Completed</div>
            <div className="mt-1 text-2xl font-semibold text-green-700">{vendorsByStatus.completed.length}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xs font-medium text-blue-800 uppercase">In Progress</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{vendorsByStatus.running.length}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-xs font-medium text-red-800 uppercase">Failed</div>
            <div className="mt-1 text-2xl font-semibold text-red-700">{vendorsByStatus.failed.length}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs font-medium text-gray-800 uppercase">Not Started</div>
            <div className="mt-1 text-2xl font-semibold text-gray-700">{vendorsByStatus.notStarted.length}</div>
          </div>
        </div>

        {/* Recent activity */}
        {vendorsByStatus.running.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Currently Running</h4>
            <div className="space-y-3">
              {vendorsByStatus.running.map(vendor => (
                <div key={vendor.id} className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    <div className="text-xs text-gray-500 truncate">{vendor.url}</div>
                  </div>
                  <div className="w-24">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${progress[vendor.id]?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right text-gray-500">
                      {progress[vendor.id]?.percentage || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default ProgressOverview;