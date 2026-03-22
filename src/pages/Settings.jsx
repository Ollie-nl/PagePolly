// src/pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCrawlerConfigs,
  saveCrawlerConfig,
  deleteCrawlerConfig,
  testCrawlerConfig,
  setActiveConfig,
  clearTestStatus
} from '../store/reducers/settingSlice';
import Modal from '../components/common/Modal';
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

function Settings() {
  const dispatch = useDispatch();
  const { crawlers, activeConfig, status, testStatus } = useSelector((state) => state.settings);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCrawler, setSelectedCrawler] = useState(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    return () => {
      dispatch(clearTestStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCrawlerConfigs());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setFormData({ name: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (crawler) => {
    setSelectedCrawler(crawler);
    setFormData({ name: crawler.name });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    dispatch(clearTestStatus());
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleOpenDeleteModal = (crawler) => {
    setSelectedCrawler(crawler);
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTestConnection = async () => {
    await dispatch(testCrawlerConfig());
  };

  const handleSaveCrawler = async (e) => {
    e.preventDefault();
    const crawlerData = { ...formData };
    if (selectedCrawler) {
      crawlerData.id = selectedCrawler.id;
    }
    const resultAction = await dispatch(saveCrawlerConfig(crawlerData));
    if (!resultAction.error) {
      handleCloseModal();
    }
  };

  const handleDeleteCrawler = async () => {
    if (!selectedCrawler) return;
    const resultAction = await dispatch(deleteCrawlerConfig(selectedCrawler.id));
    if (!resultAction.error) {
      setIsDeleteModalOpen(false);
    }
  };

  const handleSetActive = (crawler) => {
    dispatch(setActiveConfig(crawler));
    toast.success(`${crawler.name} set as active configuration`);
  };

  const inputStyles = `mt-1 block w-full rounded-md border-gray-300 shadow-sm
    focus:border-blue-500 focus:ring-blue-500 sm:text-base py-2 px-3
    bg-white text-gray-900 placeholder-gray-400
    hover:border-blue-400 transition duration-150 ease-in-out`;

  if (status === 'loading' && crawlers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Active Configuration Display */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Active Crawler Configuration</h2>
        {activeConfig ? (
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
              <h3 className="ml-2 text-lg font-medium">{activeConfig.name}</h3>
            </div>
            <p className="text-sm text-gray-500">Type: Puppeteer</p>
          </div>
        ) : (
          <p className="text-gray-500">No active crawler configuration</p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crawler Settings</h1>
          <p className="text-gray-500">Manage Puppeteer crawler configurations</p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          onClick={handleOpenAddModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Configuration
        </button>
      </div>

      {/* Crawler Configurations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium">Crawler Configurations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your Puppeteer crawler configurations
          </p>
        </div>

        {status === 'loading' && (
          <div className="p-4 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-gray-600">Loading configurations...</p>
          </div>
        )}

        {status === 'succeeded' && crawlers.length === 0 && (
          <div className="p-8 text-center">
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crawlers.map(crawler => (
                  <tr key={crawler.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeConfig?.id === crawler.id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(crawler)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{crawler.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Puppeteer
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleOpenEditModal(crawler)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => handleOpenDeleteModal(crawler)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseModal}
        title={`${isAddModalOpen ? 'Add' : 'Edit'} Crawler Configuration`}
      >
        <form onSubmit={handleSaveCrawler} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={inputStyles}
              required
              placeholder="e.g. Default Puppeteer"
              disabled={status === 'loading'}
            />
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'loading' || status === 'loading'}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md
                ${testStatus === 'loading' || status === 'loading' ? 'bg-gray-100 text-gray-500' : 'text-gray-700 bg-white hover:bg-gray-50'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {testStatus === 'loading' ? (
                <><ButtonSpinner />Testing...</>
              ) : 'Test Puppeteer'}
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={status === 'loading'}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
                  ${status === 'loading' ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {status === 'loading' ? <><ButtonSpinner />Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Crawler Configuration"
      >
        <div className="mb-4">
          <p className="text-gray-700">
            Are you sure you want to delete "{selectedCrawler?.name}"?
          </p>
          <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={status === 'loading'}
            className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteCrawler}
            disabled={status === 'loading'}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            {status === 'loading' ? <><ButtonSpinner />Deleting...</> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
