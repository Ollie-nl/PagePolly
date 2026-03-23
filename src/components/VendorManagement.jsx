// src/components/VendorManagement.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVendors, addVendor, updateVendor, deleteVendor } from '../store/reducers/vendorSlice';
import CrawlButton from './CrawlButton';

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: '', url: '', description: '' });
  const [editingVendor, setEditingVendor] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', url: '', description: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const vendorItems = useSelector(state => state.vendors.items);

  useEffect(() => {
    setVendors(vendorItems);
  }, [vendorItems]);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

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
      await dispatch(addVendor(newVendor)).unwrap();
      setSuccess('Vendor added successfully');
      setNewVendor({ name: '', url: '', description: '' });
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
      await dispatch(deleteVendor(id)).unwrap();
      setSuccess('Vendor deleted successfully');
    } catch (err) {
      setError('Failed to delete vendor');
      console.error('Error deleting vendor:', err);
    }
  };

  const handleEditOpen = (vendor) => {
    setEditingVendor(vendor.id);
    setEditForm({ name: vendor.name, url: vendor.url || '', description: vendor.description || '' });
    setError(null);
    setSuccess(null);
  };

  const handleEditCancel = () => {
    setEditingVendor(null);
    setEditForm({ name: '', url: '', description: '' });
  };

  const handleEditSave = async (id) => {
    if (!editForm.name.trim()) {
      setError('Vendor name is required');
      return;
    }
    try {
      await dispatch(updateVendor({ id, data: editForm })).unwrap();
      setSuccess('Vendor updated successfully');
      setEditingVendor(null);
    } catch (err) {
      setError('Failed to update vendor');
      console.error('Error updating vendor:', err);
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
                  {editingVendor === vendor.id ? (
                    <div style={{ flex: 1 }}>
                      <div className="form-group">
                        <label className="form-label required">Name</label>
                        <input
                          type="text"
                          className="input"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">URL</label>
                        <input
                          type="url"
                          className="input"
                          value={editForm.url}
                          onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={editForm.description}
                          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-sm mt-sm">
                        <button className="btn btn-primary btn-sm" onClick={() => handleEditSave(vendor.id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={handleEditCancel}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <h3 className="h5">{vendor.name}</h3>
                      {vendor.url && (
                        <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="text-sm">
                          {vendor.url}
                        </a>
                      )}
                      {vendor.description && (
                        <p className="text-muted text-sm mt-xs">{vendor.description}</p>
                      )}
                      <p className="text-xs text-muted mt-xs">
                        {vendor.lastCrawled
                          ? <>Last crawled: <strong>{formatDate(vendor.lastCrawled)}</strong></>
                          : <span style={{ color: 'var(--color-warning)' }}>Not crawled yet</span>
                        }
                      </p>
                    </div>
                  )}

                  {editingVendor !== vendor.id && (
                    <div className="flex items-center gap-sm">
                      <CrawlButton
                        vendorId={vendor.id}
                        onCrawlComplete={(job) => {
                          if (job.status === 'completed') {
                            setSuccess(`Crawl completed for ${vendor.name}`);
                          } else if (job.status === 'failed') {
                            setError(`Crawl failed for ${vendor.name}`);
                          }
                        }}
                      />
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditOpen(vendor)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(vendor.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
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
