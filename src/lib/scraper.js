import puppeteer from 'puppeteer';
import { delay } from './utils';

export async function scrapePage(url, productName, brandName, progress) {
    const results = [];
    const visited = new Set(); // Houd bij welke URL's al zijn bezocht
    const maxPages = 50;

    async function scrapeSinglePage(currentUrl) {
        if (visited.has(currentUrl)) return; // Skip als al bezocht

        if (visited.size >= maxPages) {
            progress.add(`Maximaal aantal pagina's bereikt (${maxPages}).`);
            return;
        }
        visited.add(currentUrl); // Markeer als bezocht

        progress.add(`Pagina openen: ${currentUrl}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        try {
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

            // Vertraging om blokkades te voorkomen
            progress.add('Wachten om blokkade te voorkomen...');
            await delay(2000); // 2 seconden wachten

            // Pagina-inhoud analyseren
            progress.add(`Pagina inhoud analyseren: ${currentUrl}`);
            const content = await page.content();
            const matches = [];

            // Controleer op productnaam en merknaam
            const lowerContent = content.toLowerCase();
            if (productName && lowerContent.includes(productName.toLowerCase())) {
                matches.push({ type: 'productName', match: productName });
            }
            if (brandName && lowerContent.includes(brandName.toLowerCase())) {
                matches.push({ type: 'brandName', match: brandName });
            }

            // Als matches gevonden zijn, voeg toe aan resultaten
            if (matches.length > 0) {
                results.push({ url: currentUrl, matches });
            }

            // Verzamel interne links
            const links = await page.evaluate(() =>
                Array.from(document.querySelectorAll('a'))
                    .map((a) => a.href)
                    .filter((href) => href.startsWith(window.location.origin)) // Alleen interne links
            );

            progress.add(`Gevonden links: ${links.length}`);

            await browser.close();

            // Crawlen van interne links
            for (const link of links) {
                await scrapeSinglePage(link);
            }
        } catch (error) {
            progress.add(`Fout bij ${currentUrl}: ${error.message}`);
        } finally {
            await browser.close();
        }
    }

    await scrapeSinglePage(url);
    return results;
}