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
        e.preventDefault(); // Voorkom pagina-herladen
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                `/api/scrape?url=${encodeURIComponent(url)}&productName=${encodeURIComponent(productName)}&brandName=${encodeURIComponent(brandName)}`
            );
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
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1>PagePolly Scraper</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        URL:
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        Productnaam:
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Bijv. Wandla"
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </label>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        Merknaam:
                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder="Bijv. Ferrum"
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '10px 15px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    {loading ? 'Scraping...' : 'Start Scraping'}
                </button>
            </form>
            {error && (
                <div style={{ color: 'red', marginTop: '20px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            {result && (
                <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
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
