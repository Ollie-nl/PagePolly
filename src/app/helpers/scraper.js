import puppeteer from 'puppeteer';
import { delay, getRandomUserAgent } from './utils';

const userAgent = getRandomUserAgent();
await page.setUserAgent(userAgent);

export async function scrapePage(url, productName, brandName, progress) {
    try {
        progress.push('Scraper gestart');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Stel een User-Agent in
        const userAgent = getRandomUserAgent();
        await page.setUserAgent(userAgent);
        progress.push('User-Agent ingesteld');

        // Laad de pagina
        progress.push(`Bezoek URL: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Vertraging om blokkade te voorkomen
        progress.push('Wachten om blokkade te voorkomen...');
        await delay(Math.random() * 2000 + 1000);

        // Haal HTML-inhoud op
        progress.push('Inhoud van de pagina ophalen...');
        const pageContent = await page.content();

        // Zoek naar product- en merknamen
        progress.push('Zoeken naar opgegeven product- en merknamen...');
        const found = [];
        if (productName && pageContent.includes(productName)) {
            found.push({ type: 'productName', match: productName });
        }
        if (brandName && pageContent.includes(brandName)) {
            found.push({ type: 'brandName', match: brandName });
        }

        // Sluit de browser
        progress.push('Browser sluiten...');
        await browser.close();

        progress.push('Scraping voltooid');
        return found;
    } catch (error) {
        progress.push(`Fout opgetreden: ${error.message}`);
        throw error;
    }
}
