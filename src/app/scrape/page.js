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
    const [country, setCountry] = useState(null); // Landinformatie

    const handleCheckCountry = async () => {
        if (!url) {
            setCountry('Geen URL ingevoerd');
            return;
        }
        setCountry('Landinformatie ophalen...');
        try {
            // URL opschonen
            const formattedUrl = url.trim().replace(/^https?:\/\//, '').split('/')[0];
    
            // Stap 1: Domeinnaam omzetten naar IP-adres
            const dnsResponse = await fetch(`https://dns.google/resolve?name=${formattedUrl}&type=A`);
            const dnsData = await dnsResponse.json();
    
            if (!dnsData || !dnsData.Answer || dnsData.Answer.length === 0) {
                setCountry('IP-adres niet gevonden');
                return;
            }
    
            const ipAddress = dnsData.Answer[0].data;
    
            // Stap 2: Gebruik Geo.js om landinformatie op te halen
            const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ipAddress}.json`);
            const geoData = await geoResponse.json();
    
            if (geoData && geoData.country) {
                setCountry(geoData.country); // Update landinformatie
            } else {
                setCountry('Land niet gevonden');
            }
        } catch (err) {
            console.error('Fout bij ophalen van land:', err);
            setCountry('Fout bij ophalen van land');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Voorkom pagina-refresh
        setProgress([]); // Reset voortgang
        setResult(null);
        setError(null);

        try {
            let formattedUrl = url.trim();
            if (!formattedUrl.startsWith('https://')) {
                formattedUrl = `https://${formattedUrl}`;
            }

            const params = new URLSearchParams({ url: formattedUrl, productName });
            if (brandName) params.append('brandName', brandName);

            const eventSource = new EventSource(`/api/scrape?${params.toString()}`);

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.done) {
                    setResult(data.results);
                    eventSource.close();
                } else if (data.error) {
                    setError(data.error);
                    eventSource.close();
                } else {
                    setProgress((prev) => [...prev, data.message]);
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
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setCountry(null); // Reset landinformatie bij wijziging
                            }}
                            placeholder="example.com"
                            required
                            className="input"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleCheckCountry}
                        className="button"
                    >
                        Check Land
                    </button>
                    {country && <p>Land: <strong>{country}</strong></p>}
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

            {result && (
                <div className="result">
                    <h3>Resultaten:</h3>
                    <pre>
                        <code>{JSON.stringify(result, null, 2)}</code>
                    </pre>
                </div>
            )}

            {error && (
                <div className="error">
                    <strong>Error:</strong> {error}
                </div>
            )}
        </div>
    );
}

export default ScrapePage;
