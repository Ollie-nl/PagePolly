// src/components/VendorManagement.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DatabaseService } from '../services/database';
import CrawlButton from './CrawlButton';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: '', url: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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
    setNewVendor(prev => ({ ...prev, [name]: value }));
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
    <div>
      {/* Add Vendor Form */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="h3">Add New Vendor</h2>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required" htmlFor="vendor-name">Name</label>
              <input
                type="text"
                id="vendor-name"
                name="name"
                value={newVendor.name}
                onChange={handleInputChange}
                className="input"
                required
                placeholder="Vendor name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="vendor-url">URL</label>
              <input
                type="url"
                id="vendor-url"
                name="url"
                value={newVendor.url}
                onChange={handleInputChange}
                className="input"
                placeholder="https://vendor-site.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="vendor-description">Description</label>
              <textarea
                id="vendor-description"
                name="description"
                value={newVendor.description}
                onChange={handleInputChange}
                className="textarea"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full"
            >
              {loading ? 'Adding...' : 'Add Vendor'}
            </button>
          </form>
        </div>
      </div>

      {/* Vendor List */}
      <div className="card">
        <div className="card-header">
          <h2 className="h3">Vendor List</h2>
          <span className="badge badge-default">{vendors.length}</span>
        </div>
        <div className="card-body">
          {vendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏪</div>
              <h3>No vendors yet</h3>
              <p>Add your first vendor using the form above.</p>
            </div>
          ) : (
            <div>
              {vendors.map((vendor) => (
                <div key={vendor.id} className="vendor-item">
                  <div style={{ flex: 1 }}>
                    <h3 className="h5">{vendor.name}</h3>
                    {vendor.url && (
                      <a
                        href={vendor.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm"
                      >
                        {vendor.url}
                      </a>
                    )}
                    {vendor.description && (
                      <p className="text-muted text-sm mt-xs">{vendor.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-sm">
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
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(vendor.id)}
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
    </div>
  );
};

export default VendorManagement;
