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
    return () => { dispatch(clearTestStatus()); };
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
    if (selectedCrawler) crawlerData.id = selectedCrawler.id;
    const resultAction = await dispatch(saveCrawlerConfig(crawlerData));
    if (!resultAction.error) handleCloseModal();
  };

  const handleDeleteCrawler = async () => {
    if (!selectedCrawler) return;
    const resultAction = await dispatch(deleteCrawlerConfig(selectedCrawler.id));
    if (!resultAction.error) setIsDeleteModalOpen(false);
  };

  const handleSetActive = (crawler) => {
    dispatch(setActiveConfig(crawler));
    toast.success(`${crawler.name} set as active configuration`);
  };

  if (status === 'loading' && crawlers.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Active configuration */}
      <div className="card mb-lg">
        <div className="card-header">
          <h2 className="h3">Active Crawler Configuration</h2>
        </div>
        <div className="card-body">
          {activeConfig ? (
            <div className="active-banner">
              <span className="badge badge-success">Active</span>
              <span className="font-medium">{activeConfig.name}</span>
              <span className="text-muted text-sm">· Type: Puppeteer</span>
            </div>
          ) : (
            <p className="text-muted">No active crawler configuration selected.</p>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Crawler Settings</h1>
          <p>Manage Puppeteer crawler configurations</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            + Add Configuration
          </button>
        </div>
      </div>

      {/* Configurations list */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="h3">Crawler Configurations</h2>
            <p className="text-muted text-sm mt-xs">Manage your Puppeteer crawler configurations</p>
          </div>
        </div>

        {status === 'loading' && (
          <div className="card-body text-center">
            <LoadingSpinner />
            <p className="text-muted mt-sm">Loading configurations...</p>
          </div>
        )}

        {status === 'succeeded' && crawlers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">⚙️</div>
            <h3>No crawler configurations yet</h3>
            <button className="link-btn mt-sm" onClick={handleOpenAddModal}>
              Add your first crawler configuration
            </button>
          </div>
        )}

        {status === 'succeeded' && crawlers.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {crawlers.map(crawler => (
                  <tr key={crawler.id}>
                    <td>
                      {activeConfig?.id === crawler.id ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <button
                          className="badge badge-default"
                          style={{ cursor: 'pointer', border: 'none' }}
                          onClick={() => handleSetActive(crawler)}
                        >
                          Set Active
                        </button>
                      )}
                    </td>
                    <td className="font-medium">{crawler.name}</td>
                    <td>
                      <span className="badge badge-primary">Puppeteer</span>
                    </td>
                    <td className="table-cell-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleOpenEditModal(crawler)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => handleOpenDeleteModal(crawler)}
                        style={{ color: 'var(--color-error)' }}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseModal}
        title={`${isAddModalOpen ? 'Add' : 'Edit'} Crawler Configuration`}
      >
        <form onSubmit={handleSaveCrawler}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input"
              required
              placeholder="e.g. Default Puppeteer"
              disabled={status === 'loading'}
            />
          </div>

          <div className="flex justify-between items-center mt-lg">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'loading' || status === 'loading'}
              className="btn btn-secondary"
            >
              {testStatus === 'loading' ? (
                <><ButtonSpinner />Testing...</>
              ) : 'Test Puppeteer'}
            </button>

            <div className="flex gap-sm">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={status === 'loading'}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary"
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
        <p className="text-muted mb-xs">
          Are you sure you want to delete <strong>"{selectedCrawler?.name}"</strong>?
        </p>
        <p className="text-sm text-muted mb-lg">This action cannot be undone.</p>

        <div className="flex justify-end gap-sm">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={status === 'loading'}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteCrawler}
            disabled={status === 'loading'}
            className="btn btn-danger"
          >
            {status === 'loading' ? <><ButtonSpinner />Deleting...</> : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
