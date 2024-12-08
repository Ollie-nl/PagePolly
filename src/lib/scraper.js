import puppeteer from 'puppeteer';
import { delay } from './utils';

export async function scrapePage(url, productName, brandName, progress) {
    try {
        progress.add('Scraper gestart');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        progress.add('Pagina openen...');
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Vertraging toevoegen
        progress.add('Wachten om blokkade te voorkomen...');
        await delay(2000); // 2 seconden wachten

        progress.add('Pagina inhoud ophalen...');
        const content = await page.content();

        const found = [];
        const lowerContent = content.toLowerCase();
        if (productName && lowerContent.includes(productName.toLowerCase())) {
            found.push({ type: 'productName', match: productName });
        }
        if (brandName && lowerContent.includes(brandName.toLowerCase())) {
            found.push({ type: 'brandName', match: brandName });
        }

        await browser.close();
        progress.add('Scraper voltooid');

        return found;
    } catch (error) {
        progress.add(`Fout: ${error.message}`);
        throw error;
    }
}
