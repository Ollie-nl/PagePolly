import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchVendors, 
  addVendor, 
  updateVendor, 
  deleteVendor, 
  selectVendor 
} from '../store/reducers/vendorSlice';
import { startCrawl } from '../store/reducers/crawlSlice';

function Vendors() {
  const dispatch = useDispatch();
  const { items: vendors, status, error, selectedVendor } = useSelector((state) => state.vendors);
  const { progress } = useSelector((state) => state.crawls);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      url: '',
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (vendor) => {
    dispatch(selectVendor(vendor.id));
    setFormData({
      name: vendor.name,
      url: vendor.url,
      description: vendor.description || ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (vendor) => {
    dispatch(selectVendor(vendor.id));
    setIsDeleteModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    dispatch(addVendor(formData))
      .unwrap()
      .then(() => {
        setIsAddModalOpen(false);
      })
      .catch(err => console.error('Failed to add vendor:', err));
  };

  const handleUpdateVendor = (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    dispatch(updateVendor({ id: selectedVendor.id, data: formData }))
      .unwrap()
      .then(() => {
        setIsEditModalOpen(false);
      })
      .catch(err => console.error('Failed to update vendor:', err));
  };

  const handleDeleteVendor = () => {
    if (!selectedVendor) return;

    dispatch(deleteVendor(selectedVendor.id))
      .unwrap()
      .then(() => {
        setIsDeleteModalOpen(false);
      })
      .catch(err => console.error('Failed to delete vendor:', err));
  };

  const handleStartCrawl = (vendorId) => {
    dispatch(startCrawl(vendorId));
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
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500">Manage vendor websites to crawl</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
          onClick={handleOpenAddModal}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Vendor
        </button>
      </div>

      {/* Vendors list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {status === 'loading' && <div className="p-4 text-center">Loading vendors...</div>}
        
        {status === 'failed' && (
          <div className="p-4 text-center">
            <p className="text-red-500">{error || 'Failed to load vendors'}</p>
            <button 
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => dispatch(fetchVendors())}
            >
              Try again
            </button>
          </div>
        )}
        
        {status === 'succeeded' && vendors.length === 0 && (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2 text-gray-500">No vendors added yet</p>
            <button 
              className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
              onClick={handleOpenAddModal}
            >
              Add your first vendor
            </button>
          </div>
        )}
        
        {status === 'succeeded' && vendors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map(vendor => (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-xs block" 
                         href={vendor.url} 
                         target="_blank" 
                         rel="noreferrer"
                      >
                        {vendor.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {progress[vendor.id] ? (
                        <div>
                          <div className="w-24 bg-gray-200 rounded-full h-2.5 mb-1">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${progress[vendor.id]?.percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress[vendor.id].status === 'completed' ? 'Completed' : `${progress[vendor.id]?.percentage || 0}% Complete`}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not crawled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleStartCrawl(vendor.id)}
                        className="text-green-600 hover:text-green-900"
                        disabled={progress[vendor.id]?.status === 'running'}
                      >
                        {progress[vendor.id]?.status === 'running' ? 'Crawling...' : 'Start Crawl'}
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(vendor)} 
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(vendor)} 
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

      {/* Add Vendor Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add Vendor"
      >
        <form onSubmit={handleAddVendor}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
              Vendor Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter vendor name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="url">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter description"
            ></textarea>
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
              Add Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Vendor"
      >
        <form onSubmit={handleUpdateVendor}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
              Vendor Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter vendor name"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="url">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Enter description"
            ></textarea>
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
              Update Vendor
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Vendor"
      >
        <div className="mb-4">
          <p className="text-gray-700">
            Are you sure you want to delete this vendor? This will also delete all associated crawl data and cannot be undone.
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
            onClick={handleDeleteVendor}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Vendors;