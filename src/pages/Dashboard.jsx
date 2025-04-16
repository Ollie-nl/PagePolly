import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../store/reducers/vendorSlice';
import { fetchCrawlStatus, fetchCrawlHistory } from '../store/reducers/crawlSlice';

function Dashboard() {
  const dispatch = useDispatch();
  const { items: vendors } = useSelector((state) => state.vendors);
  const { activeJobs, progress } = useSelector((state) => state.crawls);
  const [stats, setStats] = useState({
    totalVendors: 0,
    crawledVendors: 0,
    totalCrawls: 0,
    completedCrawls: 0,
    averageResponseTime: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Fetch required data for the dashboard
    dispatch(fetchVendors());
    dispatch(fetchCrawlStatus());
    dispatch(fetchCrawlHistory());

    // Set up polling for active crawl jobs status
    const intervalId = setInterval(() => {
      dispatch(fetchCrawlStatus());
    }, 5000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Calculate statistics
  useEffect(() => {
    if (vendors.length > 0) {
      // Calculate basic stats based on vendors and crawl data
      setStats({
        totalVendors: vendors.length,
        crawledVendors: vendors.filter(vendor => 
          progress[vendor.id]?.percentage === 100 || 
          progress[vendor.id]?.status === 'completed'
        ).length,
        totalCrawls: Object.keys(progress).length,
        completedCrawls: Object.values(progress).filter(
          p => p.percentage === 100 || p.status === 'completed'
        ).length,
        // Mock data for now
        averageResponseTime: 245,
        totalPages: vendors.length * 5 // Mock pages per vendor
      });
    }
  }, [vendors, progress]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your crawling activities</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Vendors</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-semibold">{stats.crawledVendors}</div>
            <div className="ml-2 text-sm text-gray-500">/ {stats.totalVendors} crawled</div>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${stats.totalVendors ? (stats.crawledVendors / stats.totalVendors) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Crawl Jobs</h3>
          <div className="mt-2 flex items-baseline">
            <div className="text-3xl font-semibold">{stats.completedCrawls}</div>
            <div className="ml-2 text-sm text-gray-500">/ {stats.totalCrawls} completed</div>
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-green-500 rounded-full" 
              style={{ width: `${stats.totalCrawls ? (stats.completedCrawls / stats.totalCrawls) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">Performance</h3>
          <div className="mt-2">
            <div className="text-3xl font-semibold">{stats.averageResponseTime} ms</div>
            <div className="text-sm text-gray-500">Average response time</div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-medium">{stats.totalPages}</div>
            <div className="text-sm text-gray-500">Total pages crawled</div>
          </div>
        </div>
      </div>

      {/* Active crawl jobs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Active Crawl Jobs</h2>
        {activeJobs.length === 0 ? (
          <p className="text-gray-500">No active crawl jobs</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeJobs.map(job => {
                  const vendor = vendors.find(v => v.id === job.vendorId);
                  return (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vendor?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{vendor?.url || 'No URL'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${progress[job.id]?.percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{progress[job.id]?.percentage || 0}% Complete</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.started_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;