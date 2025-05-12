// src/components/VendorManagement.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DatabaseService } from '../services/database';
import CrawlButton from './CrawlButton';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({
    name: '',
    url: '',
    description: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Get settings from Redux store
  const settings = useSelector(state => state.settings.activeConfig);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const vendorList = await DatabaseService.getVendors();
      setVendors(vendorList);
    } catch (err) {
      setError('Failed to load vendors');
      console.error('Error loading vendors:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!newVendor.name.trim()) {
      setError('Vendor name is required');
      setLoading(false);
      return;
    }

    try {
      await DatabaseService.createVendor(newVendor);
      setSuccess('Vendor added successfully');
      setNewVendor({ name: '', url: '', description: '' });
      await loadVendors();
    } catch (err) {
      setError('Failed to add vendor');
      console.error('Error adding vendor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await DatabaseService.deleteVendor(id);
      await loadVendors();
      setSuccess('Vendor deleted successfully');
    } catch (err) {
      setError('Failed to delete vendor');
      console.error('Error deleting vendor:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Add New Vendor</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={newVendor.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="url">
            URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            value={newVendor.url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={newVendor.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Add Vendor'}
        </button>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Vendor List</h2>
        {vendors.length === 0 ? (
          <p className="text-gray-500">No vendors found</p>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="border p-4 rounded flex justify-between items-start"
              >
                <div className="flex-grow">
                  <h3 className="font-semibold">{vendor.name}</h3>
                  {vendor.url && (
                    <a
                      href={vendor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {vendor.url}
                    </a>
                  )}
                  {vendor.description && (
                    <p className="text-gray-600 text-sm mt-1">{vendor.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <CrawlButton 
                    vendorId={vendor.id}
                    settings={settings}
                    onCrawlComplete={(job) => {
                      if (job.status === 'completed') {
                        setSuccess(`Crawl completed for ${vendor.name}`);
                      } else if (job.status === 'failed') {
                        setError(`Crawl failed for ${vendor.name}`);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorManagement;