import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCrawlerConfigs, 
  saveCrawlerConfig, 
  deleteCrawlerConfig 
} from '../store/reducers/settingSlice';

function Settings() {
  const dispatch = useDispatch();
  const { crawlers, status, error } = useSelector((state) => state.settings);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCrawler, setSelectedCrawler] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'scrapingbee',
    apiKey: '',
    apiEndpoint: '',
    options: {}
  });

  useEffect(() => {
    dispatch(fetchCrawlerConfigs());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      type: 'scrapingbee',
      apiKey: '',
      apiEndpoint: '',
      options: {}
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (crawler) => {
    setSelectedCrawler(crawler);
    setFormData({
      name: crawler.name,
      type: crawler.type,
      apiKey: crawler.apiKey,
      apiEndpoint: crawler.apiEndpoint,
      options: crawler.options || {}
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (crawler) => {
    setSelectedCrawler(crawler);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCrawler = (e) => {
    e.preventDefault();
    
    const crawlerData = {
      ...formData
    };
    
    if (selectedCrawler) {
      crawlerData.id = selectedCrawler.id;
    }
    
    dispatch(saveCrawlerConfig(crawlerData))
      .unwrap()
      .then(() => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
      })
      .catch(err => console.error('Failed to save crawler:', err));
  };

  const handleDeleteCrawler = () => {
    if (!selectedCrawler) return;

    dispatch(deleteCrawlerConfig(selectedCrawler.id))
      .unwrap()
      .then(() => {
        setIsDeleteModalOpen(false);
      })
      .catch(err => console.error('Failed to delete crawler:', err));
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure crawler APIs and application settings</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          onClick={handleOpenAddModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Crawler
        </button>
      </div>

      {/* Crawler Configurations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">Crawler Configurations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure the crawler APIs used to fetch data from vendor websites
          </p>
        </div>

        {status === 'loading' && <div className="p-4 text-center">Loading configurations...</div>}
        
        {status === 'failed' && (
          <div className="p-4 text-center">
            <p className="text-red-500">{error || 'Failed to load configurations'}</p>
            <button 
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => dispatch(fetchCrawlerConfigs())}
            >
              Try again
            </button>
          </div>
        )}
        
        {status === 'succeeded' && crawlers.length === 0 && (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-gray-500">No crawler configurations yet</p>
            <button 
              className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
              onClick={handleOpenAddModal}
            >
              Add your first crawler configuration
            </button>
          </div>
        )}
        
        {status === 'succeeded' && crawlers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Endpoint
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crawlers.map(crawler => (
                  <tr key={crawler.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{crawler.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {crawler.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                      {crawler.apiEndpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(crawler)} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(crawler)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Documentation Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">API Documentation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reference guide for integrating with various crawler APIs
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="text-lg font-medium">ScrapingBee</h3>
            <p className="text-sm text-gray-600 mt-1">
              ScrapingBee provides a simple API to access web pages using browsers and proxies.
            </p>
            <a 
              href="https://www.scrapingbee.com/documentation/" 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              View Documentation →
            </a>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="text-lg font-medium">Adding Custom Crawlers</h3>
            <p className="text-sm text-gray-600 mt-1">
              You can extend PagePolly with custom crawler implementations that conform to the ICrawler interface.
            </p>
            <div className="mt-2 bg-gray-50 p-3 rounded-md">
              <code className="text-xs text-gray-800 font-mono">
                <pre>{`interface ICrawler {
  crawlUrl(url: string): Promise<CrawlResult>;
  getStatus(): CrawlStatus;
}`}</pre>
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Add Crawler Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Crawler Configuration"
      >
        <form onSubmit={handleSaveCrawler}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter a name for this configuration"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="type">
              Crawler Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            >
              <option value="scrapingbee">ScrapingBee</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="apiKey">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter your API key"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              API keys are stored securely with encryption
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="apiEndpoint">
              API Endpoint
            </label>
            <input
              type="text"
              id="apiEndpoint"
              name="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://app.scrapingbee.com/api/v1"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Crawler Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Crawler Configuration"
      >
        <form onSubmit={handleSaveCrawler}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-name">
              Name
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter a name for this configuration"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-type">
              Crawler Type
            </label>
            <select
              id="edit-type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            >
              <option value="scrapingbee">ScrapingBee</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-apiKey">
              API Key
            </label>
            <input
              type="password"
              id="edit-apiKey"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter your API key"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave unchanged to keep the existing API key
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="edit-apiEndpoint">
              API Endpoint
            </label>
            <input
              type="text"
              id="edit-apiEndpoint"
              name="apiEndpoint"
              value={formData.apiEndpoint}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://app.scrapingbee.com/api/v1"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Update Configuration
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Crawler Configuration"
      >
        <div className="mb-4">
          <p className="text-gray-700">
            Are you sure you want to delete the crawler configuration "{selectedCrawler?.name}"?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            If this is the only crawler configuration, you will need to add a new one before you can crawl vendor sites.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteCrawler}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;