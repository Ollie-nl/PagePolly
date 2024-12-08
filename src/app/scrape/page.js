'use client';

import React, { useState } from 'react';
import 'styles/index.css';

function ScrapePage() {
    const [url, setUrl] = useState('');
    const [productName, setProductName] = useState('');
    const [brandName, setBrandName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Voorkom pagina-refresh
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Bouw de API-query
            const params = new URLSearchParams({ url, productName });
            if (brandName) params.append('brandName', brandName);

            // Verstuur het verzoek
            const response = await fetch(`/api/scrape?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>PagePolly Scraper</h1>
            <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                    <label htmlFor="url">Website URL:</label>
                    <div className="url-input-group">
                        <span className="url-prefix">https://</span>
                        <input
                            id="url"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="example.com"
                            required
                            className="input"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="productName">Productnaam:</label>
                    <textarea
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Voer een productnaam in (bijv. Wandla)"
                        required
                        className="textarea"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="brandName">Merknaam (optioneel):</label>
                    <textarea
                        id="brandName"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Voer een merknaam in (bijv. Ferrum)"
                        className="textarea"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="button"
                >
                    {loading ? 'Scraping...' : 'Start Scraping'}
                </button>
            </form>
            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}
            {result && (
                <div className="result">
                    <h3>Resultaten:</h3>
                    <pre>
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                </div>
            )}
        </div>
    );
}

export default ScrapePage;