'use client';

import React, { useState } from 'react';

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
        <div>
            <h1>PagePolly Scraper</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="URL"
                    required
                />
                <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Productnaam"
                    required
                />
                <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Merknaam (optioneel)"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Scraping...' : 'Start Scraping'}
                </button>
            </form>
            {error && <div>Error: {error}</div>}
            {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}

export default ScrapePage;
