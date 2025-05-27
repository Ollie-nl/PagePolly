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
  const [editMode, setEditMode] = useState(false);
  const [editVendorId, setEditVendorId] = useState(null);
  
  // Get settings from Redux store
  const settings = useSelector(state => state.settings.activeConfig);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      console.log('Vendors ophalen...');
      // Probeer vendors uit de database te halen
      try {
        const vendorList = await DatabaseService.getVendors();
        console.log('Vendors opgehaald:', vendorList);
        setVendors(vendorList);
        return;
      } catch (dbErr) {
        console.error('Database error:', dbErr);
      }
      
      // Fallback: gebruik hardcoded vendors als de database niet beschikbaar is
      console.log('Gebruik fallback hardcoded vendors in frontend');
      const fallbackVendors = [
        { id: 1, name: 'ScrapingBee...', url: 'https://www.scrapingbee.com', description: 'ScrapingBee API voor web scraping' },
        { id: 2, name: 'Puppeteer', url: 'https://pptr.dev', description: 'Directe browser crawling met Puppeteer' },
        { id: 3, name: 'Ferrum Audio', url: 'https://ferrum.audio', description: 'Voorbeeld website voor crawling tests' }
      ];
      setVendors(fallbackVendors);
      
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

  const handleEditClick = (vendor) => {
    setEditMode(true);
    setEditVendorId(vendor.id);
    setNewVendor({
      name: vendor.name,
      url: vendor.url,
      description: vendor.description
    });
    
    // Scroll naar het formulier
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditVendorId(null);
    setNewVendor({
      name: '',
      url: '',
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!newVendor.name.trim()) {
      setError('Vendor naam is verplicht');
      setLoading(false);
      return;
    }

    try {
      if (editMode) {
        // Update bestaande vendor
        console.log('Vendor bijwerken:', newVendor);
        const updatedVendor = await DatabaseService.updateVendor(editVendorId, newVendor);
        console.log('Vendor succesvol bijgewerkt:', updatedVendor);
        
        setSuccess('Vendor is succesvol bijgewerkt');
        setEditMode(false);
        setEditVendorId(null);
      } else {
        // Maak nieuwe vendor
        console.log('Vendor toevoegen:', newVendor);
        const createdVendor = await DatabaseService.createVendor(newVendor);
        console.log('Vendor succesvol toegevoegd:', createdVendor);
        
        setSuccess('Vendor is succesvol toegevoegd');
      }
      
      // Reset formulier
      setNewVendor({ name: '', url: '', description: '' });
      
      // Ververs de lijst
      await loadVendors();
    } catch (err) {
      setError(editMode ? 'Bijwerken van vendor mislukt' : 'Toevoegen van vendor mislukt');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze vendor wilt verwijderen?')) return;

    try {
      await DatabaseService.deleteVendor(id);
      await loadVendors();
      setSuccess('Vendor is succesvol verwijderd');
    } catch (err) {
      setError('Verwijderen van vendor mislukt');
      console.error('Error deleting vendor:', err);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">
          {editMode ? 'Vendor bewerken' : 'Nieuwe vendor toevoegen'}
        </h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Naam
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
            Beschrijving
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-grow bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Bezig...' : editMode ? 'Vendor bijwerken' : 'Vendor toevoegen'}
          </button>
          
          {editMode && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
            >
              Annuleren
            </button>
          )}
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Vendor lijst</h2>
        {vendors.length === 0 ? (
          <p className="text-gray-500">Geen vendors gevonden</p>
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
                <div className="flex items-center gap-2">
                  <CrawlButton 
                    vendorId={vendor.id}
                    settings={settings}
                    onCrawlComplete={(job) => {
                      if (job.status === 'completed') {
                        setSuccess(`Crawl voltooid voor ${vendor.name}`);
                      } else if (job.status === 'failed') {
                        setError(`Crawl mislukt voor ${vendor.name}`);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleEditClick(vendor)}
                    className="text-blue-600 hover:text-blue-800 bg-blue-100 px-3 py-1 rounded"
                  >
                    Bewerken
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="text-red-600 hover:text-red-800 bg-red-100 px-3 py-1 rounded"
                  >
                    Verwijderen
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