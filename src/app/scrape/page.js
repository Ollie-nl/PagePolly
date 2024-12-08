'use client';

import React, { useState } from 'react';
import 'styles/index.css';

function ScrapePage() {
    const [url, setUrl] = useState('');
    const [productName, setProductName] = useState('');
    const [brandName, setBrandName] = useState('');
    const [progress, setProgress] = useState([]); // Voor voortgangsberichten
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Voorkom pagina-refresh
        setProgress([]); // Reset voortgang
        setResult(null);
        setError(null);

        try {
            // Controleer of de URL begint met https:// en voeg dit toe indien nodig
            let formattedUrl = url.trim();
            if (!formattedUrl.startsWith('https://')) {
                formattedUrl = `https://${formattedUrl}`;
            }

            // Bouw de query parameters
            const params = new URLSearchParams({ url: formattedUrl, productName });
            if (brandName) params.append('brandName', brandName);

            // Open een EventSource-verbinding voor realtime updates
            const eventSource = new EventSource(`/api/scrape?${params.toString()}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // Beëindig als het proces voltooid is
                if (data.done) {
                    setResult(data.results);
                    eventSource.close();
                } else if (data.error) {
                    setError(data.error);
                    eventSource.close();
                } else {
                    setProgress((prev) => [...prev, data.message]); // Voeg voortgang toe
                }
            };

            eventSource.onerror = () => {
                setError('Er is een fout opgetreden tijdens het scrapen.');
                eventSource.close();
            };
        } catch (err) {
            setError(err.message);
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
                    className="button"
                >
                    Start Scraping
                </button>
            </form>

            {/* Voortgang tonen */}
            {progress.length > 0 && (
                <div className="progress">
                    <h3>Voortgang:</h3>
                    <ul>
                        {progress.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Resultaten tonen */}
            {result && (
                <div className="result">
                    <h3>Resultaten:</h3>
                    <pre>
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                </div>
            )}

            {/* Foutmelding tonen */}
            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
}

export default ScrapePage;
